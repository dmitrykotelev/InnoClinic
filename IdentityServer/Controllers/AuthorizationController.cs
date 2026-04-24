using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Duende.IdentityServer;

namespace IdentityServer.Controllers
{
    [ApiController]
    public class AuthorizationController : Controller
    {
        private readonly UserManager<AppUser> _userManager;

        public AuthorizationController(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("~/api/user/me")]
        [Authorize(IdentityServerConstants.LocalApi.PolicyName)]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            var userName = User.Identity?.Name;

            if (string.IsNullOrEmpty(userName) && userId != null)
            {
                var user = await _userManager.FindByIdAsync(userId);
                userName = user?.UserName;
            }

            return Ok(new { id = userId, name = userName });
        }
    }
}