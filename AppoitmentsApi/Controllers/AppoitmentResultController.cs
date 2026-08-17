using AppoitmentsDatabase.Models;
using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.AppoitmentsDto;
using Middleware.Repository.AppoitmentsRepository;
using Middleware.Validator.AppointmentsValidators;

namespace AppoitmentsApi.Controllers
{
    [Route("Results")]
    public class AppoitmentResultController : BaseController<AppoitmentResult, AppoitmentResultDto>
    {
        private AppoitmentResultRepoService _appoRepo;
        public AppoitmentResultController(AppoitmentResultRepoService repo, AppointmentsResultValidator validator, ILogger<AppoitmentResultController> logger) : base(repo, validator, logger)
        {
            _appoRepo = repo ?? throw new ArgumentException(nameof(AppoitmentResultRepoService));
        }
        [HttpGet("GetByAppointmentId/{appointmentId}")]
        public async Task<IActionResult> GetByAppoitmentId(string appointmentId)
        {
            var response = _appoRepo.GetByAppoitmentId(appointmentId);

            if (response == null)
                return NotFound();

            return Ok(response);
        }
    }
}
