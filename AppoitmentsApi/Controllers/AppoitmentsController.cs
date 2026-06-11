using AppoitmentsDatabase.Models;
using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.AppoitmentsDto;
using Middleware.Repository.AppoitmentsRepository;
using Middleware.Validator.AppointmentsValidators;

namespace AppoitmentsApi.Controllers
{
    [ApiController]
    [Route("Appointments/")]
    public class AppointmentsController : BaseController<Appoitment, AppointmentDto>
    {
        private AppoitmentRepoService _appoRepo;
        public AppointmentsController(AppoitmentRepoService repo, AppointmentsValidator validator, ILogger<AppointmentsController> logger) : base(repo, validator, logger)
        {
            _appoRepo = repo ?? throw new ArgumentException(nameof(AppoitmentRepoService));
        }

        [HttpPost]
        [Route("GetTimeStamps/")]
        public async Task<IActionResult> GetTimeStamps(TimeStampRequest request)
        {
            var allDailySlots = GenerateSlots(WorkDayConstants.workDayStart, WorkDayConstants.workDayEnd, request.SlotSize);
            var response = _appoRepo.GetAllByDoctorIdDate(request.DoctorId, request.Date);

            var busyIntervals = response
                .Select(inDto => new
                {
                    Start = inDto.Time,
                    End = inDto.Time.AddMinutes(30)
                })
                .ToList();

            List<TimeOnly> freeSlots = new List<TimeOnly>();
            var slotStep = TimeSpan.FromMinutes(request.SlotSize);

            foreach (var slotStart in allDailySlots)
            {
                var slotEnd = slotStart.Add(slotStep);
                bool isOverlapping = busyIntervals.Any(busy =>
                    slotStart < busy.End && slotEnd > busy.Start
                );
                if (!isOverlapping)
                {
                    freeSlots.Add(slotStart);
                }
            }

            return Ok(freeSlots);
        }


        [HttpGet]
        [Route("GetSealedTimeStamps/{DoctorId}")]
        public async Task<IActionResult> GetSealedTimeStamps(int DoctorId)
        {
            var response = _appoRepo.GetAllByDoctorId(DoctorId);

            Dictionary<DateOnly, List<TimeOnly>> timeStamps = new Dictionary<DateOnly, List<TimeOnly>>();

            foreach (AppointmentDto dto in response)
            {
                List<TimeOnly> times = new List<TimeOnly>();

                foreach (AppointmentDto InDto in response)
                {
                    if (InDto.Date == dto.Date)
                        times.Add(InDto.Time);
                }

                timeStamps.TryAdd(dto.Date, times);
            }

            return Ok(timeStamps);
        }

        private List<TimeOnly> GenerateSlots(TimeOnly workDayStart, TimeOnly workDayEnd, int slotDurationMinutes)
        {
            var slots = new List<TimeOnly>();
            var currentSlot = workDayStart;

            var step = TimeSpan.FromMinutes(slotDurationMinutes);

            while (currentSlot.Add(step) <= workDayEnd)
            {
                slots.Add(currentSlot);
                currentSlot = currentSlot.Add(step);
            }

            return slots;
        }
    }
}
