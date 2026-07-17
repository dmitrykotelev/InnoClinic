using AppoitmentsDatabase.Models;
using Microsoft.EntityFrameworkCore;

namespace AppoitmentsDatabase.Core
{
    public class AppoitmentDbContext : DbContext
    {
        public DbSet<Appoitment> Appoitments { get; set; }
        public DbSet<AppoitmentResult> Results { get; set; }
        public AppoitmentDbContext(DbContextOptions<AppoitmentDbContext> options) : base(options) { }
    }
}
