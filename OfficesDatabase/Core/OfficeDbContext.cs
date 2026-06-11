using Microsoft.EntityFrameworkCore;
using OfficesDatabse.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace OfficesDatabse.Core
{
    public class OfficeDbContext : DbContext
    {
        public DbSet<Office> OfficeSet { get; set; }
        public OfficeDbContext(DbContextOptions<OfficeDbContext> options) : base(options) { }

    }
}
