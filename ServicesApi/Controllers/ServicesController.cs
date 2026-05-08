using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository.ProfileRepository;
using Middleware.Validator.ProfileValidators;
using ServicesDatabase.Models;
using Middleware.Repository.ServicesRepository;
using Middleware.Validator.ServicesValidators;

namespace ServicesApi.Controllers
{
    [ApiController]
    [Route("Services/")]
    public class ServicesController : BaseController<Service,ServiceDto>
    {
        public ServicesController(ServicesRepoService repo, ServicesValidator validator, ILogger<ServicesController> logger) : base(repo, validator, logger) { }
    }
}
