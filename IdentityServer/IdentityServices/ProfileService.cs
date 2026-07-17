using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace IdentityServer.IdentityServices
{
    public class ProfileService : IProfileService
    {
        private readonly UserManager<AppUser> _userManager;

        public ProfileService(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task GetProfileDataAsync(ProfileDataRequestContext context)
        {
            var user = await _userManager.GetUserAsync(context.Subject);

            if (user != null)
            {
                var customClaims = new List<Claim>();

                customClaims.Add(new Claim("Email", user.Email));
                customClaims.Add(new Claim("UserName", user.UserName));

                if (user.PhotoId != null)
                    customClaims.Add(new Claim("PhotoId", user.PhotoId.ToString()));
                else
                    customClaims.Add(new Claim("PhotoId", "PhotoId"));

                var claims = await _userManager.GetClaimsAsync(user);
                var linkClaim = claims.FirstOrDefault(c => c.Type == "create_profile_link");

                if(linkClaim != null)
                    customClaims.Add(linkClaim);

                if (user.PhoneNumber  != null)
                    customClaims.Add(new Claim("PhoneNumber", user.PhoneNumber));

                var roles = await _userManager.GetRolesAsync(user);

                foreach (var role in roles)
                    customClaims.Add(new Claim("role", role));

                context.IssuedClaims.AddRange(customClaims);
            }
        }
        public async Task IsActiveAsync(IsActiveContext context)
        {
            var user = await _userManager.GetUserAsync(context.Subject);
            context.IsActive = user != null;
        }
    }
}