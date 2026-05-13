using BaseApi.Controllers;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Client;
using Middleware.Mapper.ProfileDto;
using Middleware.Repository.ProfileRepository;
using Middleware.Validator.ProfileValidators;
using ProfileDatabase.Models;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("Profile/Patient")]
    public class PatientController : BaseController<Patient,PatientDto>
    {
        public class PatientMatch
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string? MiddleName { get; set; }
            public DateTime DateOfBirth { get; set; }
        }

        private readonly PatientRepoService _patientRepoService;
        public PatientController(PatientRepoService repo, PatientValidator validator, ILogger<PatientController> logger) : base(repo, validator, logger)
        {
            _patientRepoService = repo ?? throw new ArgumentException(nameof(PatientRepoService));
        }


        [HttpPost("FindAccount")]
        public async Task<IActionResult> FindAccount([FromBody]PatientMatch patientMatch)
        {
            using (_logger.BeginScope("User to find account: {FirstName}", patientMatch.FirstName))
            {

                var responseByName = _patientRepoService.GetAllByName(patientMatch.FirstName);
                var responseByLastName = _patientRepoService.GetAllBySecondName(patientMatch.LastName);

                int count = 0;

                foreach (var patient in responseByName)
                {
                    if (patient.FirstName == patientMatch.FirstName)
                        count += 5;
                    if (patient.LastName == patientMatch.LastName)
                        count += 5;
                    if (patient.MiddleName == patientMatch.MiddleName)
                        count += 5;
                    if (patient.DateOfBirth == patientMatch.DateOfBirth)
                        count += 3;

                    if (count >= 13)
                    {
                        _logger.LogInformation($"User founded{patient.Id}");
                        return Ok(patient);
                    }
                    else count = 0;
                }

                foreach (var patient in responseByLastName)
                {
                    if (patient.FirstName == patientMatch.FirstName)
                        count += 5;
                    if (patient.LastName == patientMatch.LastName)
                        count += 5;
                    if (patient.MiddleName == patientMatch.MiddleName)
                        count += 5;
                    if (patient.DateOfBirth == patientMatch.DateOfBirth)
                        count += 3;

                    if (count >= 13)
                    {
                        _logger.LogInformation($"User founded{patient.Id}");
                        return Ok(patient);
                    }
                    else count = 0;
                }

                return NotFound();
            }
        }


        [HttpPost("LinkAccount")]
        public async Task<IActionResult> LinkAccount(int profileId, string accountId)
        {
            var response = _patientRepoService.GetById(profileId);

            if (response == null)
                return NotFound();

            response.IsLinkedToAccount = true;
            response.AccountId = accountId;

            response = _patientRepoService.Update(response);

            if (response == null)
                return BadRequest();

            return Ok();
        }

        [HttpGet("CheckProfileExists")]
        public IActionResult CheckProfileExists([FromQuery] string accountId)
        {
            using (_logger.BeginScope("Checking profile existence for AccountId: {AccountId}", accountId))
            {
                var response = _patientRepoService.GetByAccountId(accountId);

                if (response != null)
                {
                    _logger.LogInformation($"Profile found for AccountId: {accountId}. Returning true.");
                    return Ok();
                }

                _logger.LogInformation($"No profile found for AccountId: {accountId}. Returning false.");
                return NotFound();
            }
        }
    }
}
