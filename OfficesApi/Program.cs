using Microsoft.EntityFrameworkCore;
using Middleware.Mapper;
using Middleware.Repository.OfficeRepositoryService;
using Middleware.Validator.OfficeValidator;
using OfficesDatabase.Core;
using OfficesDatabse;
using OfficesDatabse.Core;

namespace OfficesApi
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
            var mongoConnectionString = builder.Configuration.GetConnectionString("MongoConnection");
            var mongoDbName = builder.Configuration.GetConnectionString("MongoDatabaseName");

            builder.Services.AddDbContext<OfficeDbContext>(options =>
              options.UseMongoDB(mongoConnectionString, mongoDbName));

            builder.Services.AddAutoMapper(cfg => { },
                 typeof(MapperProfile).Assembly);

            builder.Services.AddTransient<OfficeRepository>();
            builder.Services.AddTransient<OfficeRepositoryService>();
            builder.Services.AddTransient<OfficeValidator>();

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<OfficeDbContext>();
                    OfficeSeeder.Seed(context);
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the MongoDB database.");
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
