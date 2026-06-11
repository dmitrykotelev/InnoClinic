using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper.ProfileDto;
using Middleware.Repository.ProfileRepository;
using Middleware.Validator.ProfileValidators;
using ProfileDatabase.Models;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("Profile/Doctor")]
    public class DoctorController : BaseController<Doctor,DoctorDto>
    {
        private DoctorRepoService _doctorRepo;
        private readonly Filtrator _filtrator = new Filtrator();

        public DoctorController(DoctorRepoService repo, DoctorValidator validator, ILogger<DoctorController> logger) : base(repo, validator, logger)
        {
            _doctorRepo = repo ?? throw new ArgumentNullException(nameof(repo));
        }

        
        [HttpPost("GetAll")]
        public async Task<IActionResult> GetAll([FromBody] List<FiltredObject> filters)
        {
            _logger.LogInformation($"Got GetAll request with {filters}");
            using (_logger.BeginScope("Request: {filters}", filters))
            {
                if (filters == null) return BadRequest();
                IQueryable<Doctor> query = _doctorRepo.GetBaseQuery();

                foreach (FiltredObject filter in filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Value) || string.IsNullOrEmpty(filter.FieldName))
                        continue;

                    query = filter.FieldName.ToLower() switch
                    {
                        Filterable.Doctor => _filtrator.ApplyQuery(query, x => x.LastName, filter),
                        Filterable.SpecializationId => _filtrator.ApplyQuery(query, x => x.SpecializationId, filter),
                        _ => query
                    };
                }

                var response = _doctorRepo.GetAll(query);

                return Ok(response);
            }
        }
    }
}
