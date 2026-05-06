using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IdentityServer.Helpers
{
    public static class ClaimsHelper
    {
        public static string FindId(ClaimsPrincipal User)
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "NotFound";
        }
        
        public static string GetUserName(ClaimsPrincipal User)
        {
            return User.Identity?.Name ?? "NotFound";
        }
    }
}
