using DocumentsDatabase;
using Microsoft.EntityFrameworkCore;
using Middleware.Mapper;
using Middleware.Repository.DocumentsRepository;
using Middleware.Uploader;
using Middleware.Uploader.Minio;
using Minio;
using Minio.AspNetCore;

namespace DocumentsApi
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

            builder.Services.AddDbContext<DocumentsDbConnection>(options =>
                     options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
                     x => x.MigrationsAssembly("DocumentsDatabase")));

            builder.Services.AddAutoMapper(cfg => { }, typeof(MapperProfile).Assembly);

            builder.Services.AddTransient<PhotosRepository>();
            builder.Services.AddTransient<PhotosRepositoryService>();
            builder.Services.AddTransient<IFileUploadService, MinioService>();

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddMinio(options =>
            {
                var section = builder.Configuration.GetSection("Minio");
                options.Endpoint = section["Endpoint"];
                options.AccessKey = section["AccessKey"];
                options.SecretKey = section["SecretKey"];
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            using (var scope = app.Services.CreateScope())
            {
                try
                {
                    var context = scope.ServiceProvider.GetRequiredService<DocumentsDatabase.DocumentsDbConnection>();

                    context.Database.EnsureCreated();

                    Console.WriteLine("\n=== БАЗА ДАННЫХ DOCUMENTS УСПЕШНО СОЗДАНА! ===\n");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\n=== ОШИБКА СОЗДАНИЯ БАЗЫ DOCUMENTS: {ex.Message} ===\n");
                }
            }


            app.UseCors("AllowReactApp");
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
