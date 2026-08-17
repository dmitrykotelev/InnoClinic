using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.OfficesDto;
using Middleware.Repository.OfficeRepositoryService;
using Middleware.Validator.OfficeValidator;
using OfficesDatabse.Models;

namespace OfficesApi.Controllers
{
    [ApiController]
    [Route("Offices/")]
    public class OfficesController : BaseController<Office,OfficeDto>
    {
        OfficeRepositoryService _officeRepositoryService { get; set; }
        public OfficesController(OfficeRepositoryService repo, OfficeValidator validator, ILogger<OfficesController> logger) : base(repo,validator,logger)
        {
            _officeRepositoryService = repo ?? throw new ArgumentNullException(nameof(repo));
        }

        [HttpPost("Add")]
        public override async Task<IActionResult> Add(OfficeDto data)
        {
            using (_logger.BeginScope("Request: {dataType}", data.GetType().Name))
            {
                if (data == null)
                    return BadRequest();

                _logger.LogInformation($"Got Add Request with {data.GetType().Name}");

                data.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();

                var validationResult = await _validator.ValidateAsync(data);

                if (!validationResult.IsValid)
                {
                    _logger.LogInformation(validationResult.ToString());
                    return BadRequest(validationResult);
                }


                _logger.LogInformation($"Succesfully added {data.GetType().Name}");
                return Ok(_repo.Add(data));
            }
        }
        [HttpDelete("{id:length(24)}")]
        public async Task<IActionResult> Delete(string id)
        {
            using (_logger.BeginScope("Request to : {repoType}", _repo.GetType().Name))
            {
                _logger.LogInformation($"Got Delete  Request with {id} ID to {_repo.GetType().Name} repository");

                if (_officeRepositoryService.GetById(id) == null)
                    return NotFound();

                if (!_officeRepositoryService.Delete(id))
                    return NotFound();

                _logger.LogInformation($"Succesfully delete {id} ID to {_repo.GetType().Name} repository");
                return Ok();
            }
        }
        [HttpGet("{id:length(24)}")]
        public async Task<IActionResult> GetByGuid(string id)
        {
            using (_logger.BeginScope("Request to : {repoType}", _repo.GetType().Name))
            {
                _logger.LogInformation($"Got Delete  Request with {id} ID to {_repo.GetType().Name} repository");

                var response = _officeRepositoryService.GetById(id);

                if (response == null)
                    return NotFound();

                _logger.LogInformation($"Succesfully delete {id} ID to {_repo.GetType().Name} repository");
                return Ok(response);
            }
        }
    }
}
