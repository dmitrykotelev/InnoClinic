using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace IdentityServer.Controllers
{
    [ApiController]
    [Route("EmailChek/")]
    public class EmailCheckController : Controller
    {
        private readonly UserManager<AppUser> _userManager;

        public EmailCheckController(UserManager<AppUser> userManager)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        }

        [HttpGet]
        [Route("{email}")]
        public async Task<IActionResult> CheckEmail(string email)
        {
            var response = await _userManager.FindByEmailAsync(email);

            if (response == null)
                return Ok();

            return BadRequest("Email already exist");
        }
    }
}
