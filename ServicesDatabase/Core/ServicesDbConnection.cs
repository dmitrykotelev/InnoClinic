using Microsoft.EntityFrameworkCore;
using ServicesDatabase.Models;

namespace ServicesDatabase.Core
{
    public class ServicesDbConnection : DbContext
    {
        public ServicesDbConnection(DbContextOptions<ServicesDbConnection> options)
            : base(options) { }

        public DbSet<Specialization> Specializations { get; set; }
        public DbSet<ServiceCategory> ServiceCategories { get; set; }
        public DbSet<Service> Services { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Specialization>().HasData(
                new Specialization { Id = 1, Name = "General Therapy", isActiove = true },
                new Specialization { Id = 2, Name = "Cardiology", isActiove = true },
                new Specialization { Id = 3, Name = "Dentistry", isActiove = true }
            );

            modelBuilder.Entity<ServiceCategory>().HasData(
                new ServiceCategory { Id = 1, Name = "Consultation", TimeSlotSize = 30 },
                new ServiceCategory { Id = 2, Name = "Diagnostics", TimeSlotSize = 60 },
                new ServiceCategory { Id = 3, Name = "Analyses", TimeSlotSize = 45 }
            );

            modelBuilder.Entity<Service>().HasData(
                new Service { Id = 1, ServiceCategoryId = 1, SpecializationId = 1, Name = "Cardiologist Initial", isActive = true },
                new Service { Id = 2, ServiceCategoryId = 1, SpecializationId = 1, Name = "Cardiologist Follow-up", isActive = true },
                new Service { Id = 3, ServiceCategoryId = 1, SpecializationId = 2, Name = "Neurologist Initial", isActive = true },
                new Service { Id = 4, ServiceCategoryId = 1, SpecializationId = 3, Name = "Surgeon Consultation", isActive = false },

                new Service { Id = 5, ServiceCategoryId = 2, SpecializationId = 4, Name = "X-Ray Chest", isActive = true },
                new Service { Id = 6, ServiceCategoryId = 2, SpecializationId = 4, Name = "MRI Brain", isActive = true },
                new Service { Id = 7, ServiceCategoryId = 2, SpecializationId = 4, Name = "Ultrasound Abdomen", isActive = false },

                new Service { Id = 8, ServiceCategoryId = 3, SpecializationId = 5, Name = "Complete Blood Count", isActive = true },
                new Service { Id = 9, ServiceCategoryId = 3, SpecializationId = 5, Name = "Lipid Panel", isActive = true },
                new Service { Id = 10, ServiceCategoryId = 3, SpecializationId = 5, Name = "Vitamin D", isActive = false }
            );
        }
    }
}