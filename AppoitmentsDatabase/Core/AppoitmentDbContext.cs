using AppoitmentsDatabase.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppoitmentsDatabase.Core
{
    public class AppoitmentDbContext : DbContext
    {
        public DbSet<Appoitment> Appoitments { get; set; }
        public AppoitmentDbContext(DbContextOptions<AppoitmentDbContext> options) : base(options) { }
    }
}
