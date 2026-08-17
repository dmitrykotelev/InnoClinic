using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Middleware.Repository.ProfileRepository;
using System.Security.Claims;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("DoctorAuthorize/")]
    public class DoctorAuthorizeController : Controller
    {
        private readonly DoctorRepoService _doctorRepoService;
        public DoctorAuthorizeController(ReceptionRepoService receptionRepoService, DoctorRepoService doctorRepoService)
        {
            _doctorRepoService = doctorRepoService ?? throw new ArgumentNullException(nameof(doctorRepoService));
        }

        [HttpGet("Me")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> GetMyDoctorProfile()
        {
            var accountId = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier)?.Value;

            var profile = _doctorRepoService.GetByAccId(accountId);

            if (profile == null)
                return NotFound("У данного аккаунта работника не существует профиля, скорее всего аккаунт создан некоректно");

            var determinedRole = "doctor";
            var profileData = new
            {
                AccountId = accountId,
                Role = determinedRole,
                Profile = profile
            };

            return Ok(profileData);
        }
    }
}
