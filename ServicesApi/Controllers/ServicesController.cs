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
    [Route("Services/")]
    public class ServicesController : BaseController<Service,ServiceDto>
    {
        private readonly ServicesRepoService _servicesRepo;
        private readonly Filtrator _filtrator = new Filtrator();
        public ServicesController(ServicesRepoService repo, ServicesValidator validator, ILogger<ServicesController> logger) : base(repo, validator, logger)
        {
            _servicesRepo = repo ?? throw new ArgumentNullException(nameof(repo));
        }

        [HttpGet("GetBySpec/{specId}")]
        public async Task<IActionResult> GetBySpecId(int specId)
        {
            var response = _servicesRepo.GetBySpecId(specId);

            if (response == null)
                return NotFound();

            return Ok(response);
        }

        [HttpPost("GetAll")]
        public async Task<IActionResult> GetAll([FromBody] List<FiltredObject> filters)
        {
            _logger.LogInformation($"Got GetAll request with {filters}");
            using (_logger.BeginScope("Request: {filters}", filters))
            {
                if (filters == null) 
                    return BadRequest();

                var query = _servicesRepo.GetBaseQuery();

                _logger.LogWarning(query.ToString());

                foreach (FiltredObject filter in filters)
                {
                    if (string.IsNullOrWhiteSpace(filter.Value) || string.IsNullOrEmpty(filter.FieldName))
                        continue;

                    var queryBefore = query;

                    query = filter.FieldName.ToLower() switch
                    {
                        Filterable.Service => _filtrator.ApplyQuery(query, x => x.Name, filter),
                        Filterable.SpecializationId => _filtrator.ApplyQuery(query, x => x.SpecializationId, filter),
                        _ => query
                    };
                }
                var response = _servicesRepo.GetAll(query);

                return Ok(response);
            }
        }
    }
}
