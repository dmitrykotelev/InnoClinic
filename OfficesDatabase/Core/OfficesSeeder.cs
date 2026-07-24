using Microsoft.EntityFrameworkCore;
using OfficesDatabse.Core;
using OfficesDatabse.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OfficesDatabase.Core
{
    public static class OfficeSeeder
    {
        public static void Seed(OfficeDbContext context)
        {
            context.Database.EnsureCreated();
            if (!context.Set<Office>().Any())
            {
                var defaultOffices = new List<Office>
                {
                    new Office
                    {
                        Id = 1,
                        Adress = "Moscow ",
                        PhotoId = Guid.NewGuid(),
                        PhoneNumber = "+7 (495) 123-45-67",
                        IsActive = true
                    },
                    new Office
                    {
                        Adress = "St.Petersburg",
                        PhotoId = Guid.NewGuid(),
                        PhoneNumber = "+7 (812) 765-43-21",
                        IsActive = true
                    },
                    new Office
                    {
                        Id = 3,
                        Adress = "Brest",
                        PhotoId = Guid.NewGuid(),
                        PhoneNumber = "+7 (383) 999-88-77",
                        IsActive = false
                    }
                };

                context.Set<Office>().AddRange(defaultOffices);

                context.SaveChanges();

                Console.WriteLine("--> Seed data for MongoDB Offices successfully initialized.");
            }
            else
            {
                Console.WriteLine("--> MongoDB Offices already contain data. Seeding skipped.");
            }
        }
    }
}
