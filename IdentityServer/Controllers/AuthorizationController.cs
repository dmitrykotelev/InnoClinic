using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Duende.IdentityServer;
using IdentityServer.Helpers;

namespace IdentityServer.Controllers
{
    [ApiController]
    public class AuthorizationController : Controller
    {
        private readonly UserManager<AppUser> _userManager;

        public AuthorizationController(UserManager<AppUser> userManager)
        {
            if(userManager != null)
                _userManager = userManager;
        }

        [HttpGet("~/api/user/me")]
        [Authorize(IdentityServerConstants.LocalApi.PolicyName)]
        public async Task<IActionResult> GetCurrentUser()
        {
            
            var userId = ClaimsHelper.FindId(User);
            var userName = ClaimsHelper.GetUserName(User);

            if (string.IsNullOrEmpty(userName) && userId != null)
            {
                var user = await _userManager.FindByIdAsync(userId);
                userName = user?.UserName;
            }
            else
                return NotFound();

            return Ok(new { id = userId, name = userName });
        }
    }
}