using AppoitmentsDatabase.Models;
using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.AppoitnmentFiltrator;
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
        static private readonly Filtrator _filtrator = new Filtrator();
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
        [Route("GetSealedTimeStamps/{doctorId}")]
        public async Task<IActionResult> GetSealedTimeStamps(int doctorId)
        {
            var response = _appoRepo.GetAllByDoctorId(doctorId);

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

        [HttpGet("GetAllByPatient/{patientId}")]
        public async Task<IActionResult> GetAllByPatient(int patientId)
        {
            var response = _appoRepo.GetAllByPatientId(patientId);

            if (response == null)
                return NotFound();

            return Ok(response);
        }
        [HttpPost("GetAll")]
        public async Task<IActionResult> GetAll([FromBody] List<FiltredObject> filters)
        {
            if (filters == null) 
                return BadRequest();
            var query = _appoRepo.GetBaseQuery();

            foreach (FiltredObject filter in filters)
            {
                if (string.IsNullOrWhiteSpace(filter.Value) || string.IsNullOrEmpty(filter.FieldName))
                    continue;

                query = filter.FieldName.ToLower() switch
                {
                    Filterable.Doctor => _filtrator.ApplyQuery(query, x => x.DoctorId, filter),
                    Filterable.Date => _filtrator.ApplyQuery(query, x => x.Date, filter),
                    Filterable.Service => _filtrator.ApplyQuery(query, x => x.ServiceId, filter),
                    Filterable.Status => _filtrator.ApplyQuery(query, x => x.IsApproved, filter),
                    _ => query
                };
            }

            var response = _appoRepo.GetAll(query);

            return Ok(response);
        }


        [HttpPost("Reshedulle")]
        public async Task<IActionResult> Reshedulle(int id, DateTime date)
        {
            var response = _appoRepo.Reshedulle(id, date);

            if (response == null)
                return NotFound();

            return Ok();
        }
        [HttpPost("Approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var response = _appoRepo.Approve(id);

            if (response == null)
                return NotFound();

            return Ok();
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
