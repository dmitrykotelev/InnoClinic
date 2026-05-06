using BaseApi.Controllers;
using ProfileDatabase.Models;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.ProfileDto;
using Middleware.Repository.ProfileRepository;
using Middleware.Validator.ProfileValidators;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("Profile/Doctor")]
    public class DoctorController : BaseController<Doctor,DoctorDto>
    {
        public DoctorController(DoctorRepoService repo, DoctorValidator validator, ILogger<DoctorController> logger) : base(repo, validator, logger) { }
    }
}
