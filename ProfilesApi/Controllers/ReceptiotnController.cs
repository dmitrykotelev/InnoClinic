using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Validator.ProfileValidators;
using ProfileDatabase.Models;
using Middleware.Mapper.ProfileDto;
using Middleware.Repository.ProfileRepository;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("Profile/Reception")]
    public class ReceptiotnController : BaseController<Reception,ReceptionDto>
    {
        public ReceptiotnController(ReceptionRepoService repo, ReceptionValidator validator, ILogger<ReceptiotnController> logger) : base(repo, validator, logger) { }
    }
}
