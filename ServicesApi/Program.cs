using Microsoft.EntityFrameworkCore;
using Middleware.Repository.ServicesRepository;
using Middleware.Validator.ServicesValidators;
using ServicesDatabase.Core;
using ServicesDatabase.Repository;
using Middleware.Mapper;

namespace ServicesApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var corsSettings = builder.Configuration.GetSection("CorsSettings").Get<CorsSettings>();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp",
                    policy =>
                    {
                        if (corsSettings?.AllowedOrigins != null && corsSettings.AllowedOrigins.Length > 0)
                        {
                            policy.WithOrigins(corsSettings.AllowedOrigins)
                                  .AllowAnyHeader()
                                  .AllowAnyMethod();
                        }
                    });
            });

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddDbContext<ServicesDbConnection>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
                                 x => x.MigrationsAssembly("ServicesDatabase")));

            builder.Services.AddAutoMapper(cfg => { },
                 typeof(MapperProfile).Assembly);

            AddRepos(builder);
            AddValidators(builder);
            AddRepoServices(builder);

            var app = builder.Build();
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseAuthorization();

            app.UseCors("AllowReactApp");
            app.MapControllers();

            app.Run();
        }

        private static void AddRepoServices(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<ServicesRepoService>();
            builder.Services.AddTransient<ServicesCategoriesRepoService>();
            builder.Services.AddTransient<SpecializationsRepoService>();
        }

        private static void AddValidators(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<ServicesValidator>();
            builder.Services.AddTransient<ServiceCategoriesValidator>();
            builder.Services.AddTransient<SpecializatioValidator>();
        }

        private static void AddRepos(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<ServiceRepo>();
            builder.Services.AddTransient<ServiceCategoryRepo>();
            builder.Services.AddTransient<SpecializationRepo>();
        }
    }
}
