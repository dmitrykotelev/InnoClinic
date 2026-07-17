using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Middleware.Repository.ProfileRepository;
using System.Security.Claims;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("PatientAuthorize")]
    public class PatientFrontProfileController : Controller
    {
        private readonly PatientRepoService _patientRepoService;

        public PatientFrontProfileController(PatientRepoService patientRepoService)
        {
            _patientRepoService = patientRepoService ?? throw new ArgumentNullException(nameof(patientRepoService));
        }

        [HttpGet("me")]
        [Authorize(Roles = "patient")]
        public async Task<IActionResult> GetPatientProfile()
        {
            var accountId = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier)?.Value;

            var profile = _patientRepoService.GetByAccountId(accountId);

            if (profile == null)
                return Ok(new
                {
                    AccountId = accountId,
                    IsProfileCreated = false
                });

            return Ok(new
            {
                AccountId = accountId,
                IsProfileCreated = true,
            });
        }
    }
}
