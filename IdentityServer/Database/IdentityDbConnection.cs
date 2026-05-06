using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OpenIddict;

namespace IdentityServerDatabase
{
    public class IdentityDbConnection : IdentityDbContext<AppUser>
    {
        public IdentityDbConnection(DbContextOptions<IdentityDbConnection> options) : base(options) { }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.UseOpenIddict();
        }
    }
}
