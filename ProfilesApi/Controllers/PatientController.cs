using Azure.Core;
using BaseApi.Controllers;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly PatientRepoService _patientRepoService;
        public PatientController(PatientRepoService repo, PatientValidator validator, ILogger<PatientController> logger) : base(repo, validator, logger)
        {
            _patientRepoService = repo ?? throw new ArgumentException(nameof(PatientRepoService));
        }


        [HttpPost("FindAccount")]
        public async Task<IActionResult> FindAccount([FromBody]PatientDto patientMatch)
        {
            using (_logger.BeginScope("User to find account: {FirstName}", patientMatch.FirstName))
            {
                var response = _patientRepoService.MatchPatient(patientMatch);

                if (response == null)
                    return NotFound();

                return Ok(response);
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
        [HttpGet("GetByAccId/{accountId}")]
        public IActionResult GetByAccId(string accountId)
        {
            if (string.IsNullOrWhiteSpace(accountId))
            {
                return BadRequest("AccountId is required.");
            }

            using (_logger.BeginScope("Checking profile existence for AccountId: {AccountId}", accountId))
            {
                var response = _patientRepoService.GetByAccountId(accountId);

                if (response != null)
                {
                    _logger.LogInformation($"Profile found for AccountId: {accountId}.");
                    return Ok(response);
                }

                _logger.LogInformation($"No profile found for AccountId: {accountId}. Returning false.");
                return NotFound();
            }
        }
    }
}
