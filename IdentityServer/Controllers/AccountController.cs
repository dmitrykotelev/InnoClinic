using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace IdentityServer.Controllers
{
    [ApiController]
    [Route("Profile/")]
    public class AccountController : Controller
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<PatientRegistrationController> _logger;

        public AccountController(UserManager<AppUser> userManager, ILogger<PatientRegistrationController> logger)
        {
            _userManager = userManager ?? throw new ArgumentException(nameof(userManager));
            _logger = logger ?? throw new ArgumentException(nameof(logger));
        }

        [HttpPost("UpdatePhoto")]
        public async Task<IActionResult> SetPhotoId([FromQuery] string userId, [FromQuery] Guid photoId)
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

        [HttpGet("GetPhotoId")]
        public async Task<IActionResult> GetPhotoId([FromQuery] string userId)
        {
            using (_logger.BeginScope("User Photo Request: {id}", userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    return Ok(user.PhotoId?.ToString() ?? "null");
                }
                return NotFound();
            }
        }

        [HttpPost("UpdatePhoneNumber")]
        public async Task<IActionResult> SetPhoneNumber([FromQuery] string userId, [FromQuery] string phoneNumber)
        {
            using (_logger.BeginScope("User Phone Update: {id}", userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    user.PhoneNumber = phoneNumber;
                    await _userManager.UpdateAsync(user);
                    return Ok();
                }
                return NotFound();
            }
        }

        [HttpGet("GetPhoneNumber")]
        public async Task<IActionResult> GetPhoneNumber([FromQuery] string userId)
        {
            using (_logger.BeginScope("User Phone Request: {id}", userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    return Ok(user.PhoneNumber ?? "");
                }
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccountById (string id)
        {
            var user = await _userManager.FindByIdAsync(id);

            if(user == null)
                return NotFound();

            var response = await _userManager.DeleteAsync(user);

            if (!response.Succeeded)
                return BadRequest();

            return Ok();

        }
    }
}