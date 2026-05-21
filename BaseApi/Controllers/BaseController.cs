using BaseModules.DatabaseClasses.DatabaseInterfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper;
using Middleware.Repository;

namespace BaseApi.Controllers
{
    [ApiController]
    public class BaseController<T, TT> : Controller where T : class, IDataModel
                                                   where TT : class, IDto
    {
        protected RepositoryService<T, TT> _repo;
        protected AbstractValidator<TT> _validator;
        protected ILogger<BaseController<T, TT>> _logger;
        public BaseController(RepositoryService<T, TT> repo, AbstractValidator<TT> validator, ILogger<BaseController<T,TT>> logger)
        {
            _repo = repo ?? throw new ArgumentException(nameof(repo));
            _validator = validator ?? throw new ArgumentException(nameof(validator));
            _logger = logger ?? throw new ArgumentException(nameof(logger));
        }

        [HttpPost("Add")]
        public virtual async Task<IActionResult> Add(TT data)
        {
            using (_logger.BeginScope("Request: {dataType}", data.GetType().Name))
            {
                if (data == null)
                    return BadRequest();

                _logger.LogInformation($"Got Add Request with {data.GetType().Name}");

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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            using (_logger.BeginScope("Request: {id}", id))
            {
                var data = _repo.GetById(id);
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using (_logger.BeginScope("Request to : {repoType}", _repo.GetType().Name))
            {
                _logger.LogInformation($"Got Delete  Request with {id} ID to {_repo.GetType().Name} repository");

                if (_repo.GetById(id) == null)
                    return NotFound();

                if (!_repo.Delete(id))
                    return NotFound();

                _logger.LogInformation($"Succesfully delete {id} ID to {_repo.GetType().Name} repository");
                return Ok();
            }
        }

        [HttpPost("Update")]
        public virtual async Task<IActionResult> Update(TT data)
        {
            using (_logger.BeginScope("Request: {dataType}", data.GetType().Name))
            {
                _logger.LogInformation($"Got Update  Request with {data.GetType().Name}");
                if (data == null)
                    return BadRequest();

                _logger.LogInformation($"Succesfully Update Request with {data.GetType().Name}");
                return Ok(_repo.Update(data));
            }
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            using (_logger.BeginScope("Request: {dataType}", _repo.GetType().Name))
            {
                _logger.LogInformation($"Got GetAll  Request to {_repo.GetType().Name} repository");
                return Ok(_repo.GetAll());
            }
        }

    }
}