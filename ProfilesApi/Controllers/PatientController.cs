using Azure.Core;
using BaseApi.Controllers;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper.ProfileDto;
using Middleware.Repository.ProfileRepository;
using Middleware.Validator.ProfileValidators;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("Profile/Patient")]
    public class PatientController : BaseController<Patient,PatientDto>
    {
        private readonly PatientRepoService _patientRepoService;
        static private readonly Filtrator _filtrator = new Filtrator();
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
        [HttpGet("GetByAccId")]
        public IActionResult GetByAccId([FromQuery]string accountId)
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

        [HttpGet("ByGuid/{id:guid}")]
        public async Task<IActionResult> GetById(string id)
        {
            using (_logger.BeginScope("Request: {id}", id))
            {
                var data = _repo.GetBaseQuery().FirstOrDefault(x => x.AccountId == id);
                _logger.LogInformation($"Got GetById Request with {data.GetType().Name} by {id} ID");

                if (data == null)
                    return NotFound();
                else
                {
                    _logger.LogInformation($"Founded {data.GetType().Name} by {id} ID");
                    return Ok(data);
                }
            }
        }

        [HttpPost("GetAll")]
        public async Task<IActionResult> GetAll([FromBody] List<FiltredObject> filters)
        {
            _logger.LogInformation($"Got GetAll request with {filters}");
            using (_logger.BeginScope("Request: {filters}", filters))
            {
                if (filters == null) return BadRequest();
                var query = _patientRepoService.GetBaseQuery();

                foreach (FiltredObject filter in filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Value) || string.IsNullOrEmpty(filter.FieldName))
                        continue;

                    query = filter.FieldName.ToLower() switch
                    {
                        Filterable.Patient => _filtrator.ApplyQuery(query, x => x.FirstName, filter),
                        _ => query
                    };
                }

                var response = _patientRepoService.GetAll(query);

                return Ok(response);
            }
        }
    }
}
