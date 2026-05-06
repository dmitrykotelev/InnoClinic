using Duende.IdentityServer.Models;
using Duende.IdentityServer.Services;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace IdentityServer
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


                if(user.PhoneNumber  != null)
                    customClaims.Add(new Claim("PhoneNumber", user.PhoneNumber));

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