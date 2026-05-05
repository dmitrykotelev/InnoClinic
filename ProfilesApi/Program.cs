using Microsoft.EntityFrameworkCore;
using Middleware.Validator.ProfileValidators;
using ProfileDatabase.Core;
using ProfileDatabase.Repository;
using Middleware.Repository.ProfileRepository;
using Middleware.Mapper;

namespace ProfilesApi
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

            builder.Services.AddDbContext<ProfileDbConnection>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
                                 x => x.MigrationsAssembly("ProfileDatabase")));

            builder.Services.AddAutoMapper(cfg => { }, typeof(MapperProfile).Assembly);

            AddRepos(builder);
            AddRepoServices(builder);
            AddValidators(builder);

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowReactApp");

            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }

        private static void AddRepos(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<DoctorRepo>();
        }

        private static void AddValidators(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<DoctorValidator>();
        }

        private static void AddRepoServices(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<DoctorRepoService>();
        }
    }
}