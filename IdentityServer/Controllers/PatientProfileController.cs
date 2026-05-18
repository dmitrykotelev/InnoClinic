using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace IdentityServer.Controllers
{
    [ApiController]
    [Route("Profile/")]
    public class PatientProfileController : Controller
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<RegistrationController> _logger;

        public PatientProfileController(UserManager<AppUser> userManager, IConfiguration configuration, ILogger<RegistrationController> logger)
        {
            _userManager = userManager ?? throw new ArgumentException(nameof(userManager));
            _logger = logger ?? throw new ArgumentException(nameof(logger));
        }
        [HttpPost("UpdatePhoto")]
        public async Task<IActionResult> SetPhotoId(string userId, Guid photoId)
        {
            using (_logger.BeginScope("User Photo Update: {id}", userId))
            { 
                var user = await _userManager.FindByIdAsync(userId);

                if (user != null)
                {
                    user.PhotoId = photoId;

                    await _userManager.UpdateAsync(user);
                    return Ok();
                }

                return NotFound();
            }
        }
    }
}
