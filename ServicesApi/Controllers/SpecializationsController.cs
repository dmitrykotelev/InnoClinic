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
    [Route("Specializations")]
    public class SpecializationsController : BaseController<Specialization, SpecializationDto>
    {
        public SpecializationsController(SpecializationsRepoService repo, SpecializatioValidator validator, ILogger<SpecializationsController> logger) : base(repo, validator, logger) { }
    }
}
