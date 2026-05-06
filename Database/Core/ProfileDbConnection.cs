using Microsoft.EntityFrameworkCore;
using ProfileDatabase.Models;

namespace ProfileDatabase.Core
{
    public class ProfileDbConnection : DbContext
    {
        public ProfileDbConnection(DbContextOptions<ProfileDbConnection> options)
            : base(options) { }

        public DbSet<Doctor> Doctors { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            SeedData(modelBuilder);
        }

        private static void SeedData(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Doctor>().HasData(
                new Doctor
                {
                    Id = 1,
                    FirstName = "Petr",
                    LastName = "Petrovich",
                    MiddleName = "Petrov",
                    DateOfBirth = new DateTime(1985, 5, 15, 0, 0, 0, DateTimeKind.Utc),
                    AccountId = 1,
                    SpecializationId = 1,
                    OfficeId = 1,
                    CareerStartYear = new DateTime(2015, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                    Status = true 
                },
                new Doctor
                {
                    Id = 2,
                    FirstName = "Linda",
                    LastName = "Davis",
                    MiddleName = "Linda",
                    DateOfBirth = new DateTime(1982, 8, 20, 0, 0, 0, DateTimeKind.Utc),
                    AccountId = 2,
                    SpecializationId = 2,
                    OfficeId = 2, 
                    CareerStartYear = new DateTime(2010, 8, 1, 0, 0, 0, DateTimeKind.Utc),
                    Status = true
                },
                new Doctor
                {
                    Id = 3,
                    FirstName = "Elizabeth",
                    LastName = "Sarah",
                    MiddleName = "Elizabeth",
                    DateOfBirth = new DateTime(1990, 11, 10, 0, 0, 0, DateTimeKind.Utc),
                    AccountId = 3,
                    SpecializationId = 3,
                    OfficeId = 1,
                    CareerStartYear = new DateTime(2020, 9, 1, 0, 0, 0, DateTimeKind.Utc),
                    Status = false  
                }
            );
        }
    }
}