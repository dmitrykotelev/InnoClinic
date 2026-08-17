using IdentityServer.Helpers;
using Microsoft.AspNetCore.Identity;

namespace IdentityServer.Database
{
    public static class DatabaseSeeder
    {
        public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            string[] roleNames = { RoleHelper.Admin, RoleHelper.Doctor, RoleHelper.Receptionist, RoleHelper.Patient };

            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }
        }
    }
}
