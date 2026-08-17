using AppointmentsApi.Services;
using AppoitmentsDatabase;
using AppoitmentsDatabase.Core;
using Hangfire;
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

            builder.Services.AddTransient<AppointmentsResultRepository>();
            builder.Services.AddTransient<AppoitmentResultRepoService>();
            builder.Services.AddTransient<AppointmentsResultValidator>();

            builder.Services.AddTransient<ResultPdfGenerator>();

            builder.Services.AddHttpClient();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                try
                {
                    var context = scope.ServiceProvider.GetRequiredService<AppoitmentsDatabase.Core.AppoitmentDbContext>();

                    context.Database.EnsureCreated();

                    Console.WriteLine("\n=== БАЗА ДАННЫХ APPOINTMENTS УСПЕШНО СОЗДАНА! ===\n");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\n=== ОШИБКА СОЗДАНИЯ БАЗЫ APPOINTMENTS: {ex.Message} ===\n");
                }
            }

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
