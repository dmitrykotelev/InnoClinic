using AppoitmentsDatabase;
using AppoitmentsDatabase.Core;
using Microsoft.EntityFrameworkCore;
using Middleware.Mapper;
using Middleware.Repository.AppoitmentsRepository;
using Middleware.Validator.AppointmentsValidators;

namespace AppoitmentsApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddDbContext<AppoitmentDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("PostgresConnection")));

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

            builder.Services.AddAutoMapper(cfg => { }, typeof(MapperProfile).Assembly);

            builder.Services.AddTransient<AppointmentsRepository>();
            builder.Services.AddTransient<AppoitmentRepoService>();
            builder.Services.AddTransient<AppointmentsValidator>();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            app.UseCors("AllowReactApp");

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
