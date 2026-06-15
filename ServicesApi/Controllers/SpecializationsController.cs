using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository.ServicesRepository;
using Middleware.Validator.ServicesValidators;
using ServicesDatabase.Models;

namespace ServicesApi.Controllers
{
    [ApiController]
    [Route("Specializations")]
    public class SpecializationsController : BaseController<Specialization, SpecializationDto>
    {
        private SpecializationsRepoService _specRepo;
        public SpecializationsController(SpecializationsRepoService repo, SpecializatioValidator validator, ILogger<SpecializationsController> logger) : base(repo, validator, logger)
        {
            _specRepo = repo ?? throw new ArgumentNullException(nameof(repo));
        }

        [HttpPost("GetAllFiltered")]
        public async Task<IActionResult> GetAll([FromBody] List<FiltredObject> filters)
        {
            _logger.LogInformation($"Got GetAll request with {filters}");
            using (_logger.BeginScope("Request: {filters}", filters))
            {
                if (filters == null) return BadRequest();

                FiltredObject myFilter = null;

                foreach (FiltredObject filter in filters)
                    if (filter.FieldName.ToLower() == Filterable.Specialization.ToLower())
                        myFilter = filter;

                if (myFilter == null)
                    return BadRequest();

                var response = _specRepo.GetAll(myFilter.Value);

                return Ok(response);
            }
        }

    }
}
