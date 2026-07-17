using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

            builder.Services.AddAutoMapper(cfg => { }, typeof(MapperProfile).Assembly);

            AddRepos(builder);
            AddValidators(builder);
            AddRepoServices(builder);

            // === НАСТРОЙКА JWT АВТОРИЗАЦИИ ДЛЯ DOCKER ===
            var internalIdentityUrl = "http://identityserver:8080";
            var externalIdentityUrl = "http://identity.inno-clinic.com";

            var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);
            Thread.Sleep(3000);

            try
            {
                var jwksJson = httpClient.GetStringAsync($"{internalIdentityUrl}/.well-known/openid-configuration/jwks").Result;
                var jwks = new JsonWebKeySet(jwksJson);

                builder.Services.AddAuthentication("Bearer")
                    .AddJwtBearer("Bearer", options =>
                    {
                        options.MetadataAddress = $"{internalIdentityUrl}/.well-known/openid-configuration";
                        options.RequireHttpsMetadata = false;
                        options.MapInboundClaims = false;

                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateAudience = false,
                            RoleClaimType = "role",
                            NameClaimType = "name",
                            ValidateIssuer = true,
                            ValidIssuer = externalIdentityUrl,
                            IssuerSigningKeys = jwks.GetSigningKeys(),
                            ValidateIssuerSigningKey = true
                        };
                    });
                builder.Services.AddAuthorization();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка скачивания ключей JWT: {ex.Message}");
            }

            var app = builder.Build();

            // Автоматическое применение миграций при запуске
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ServicesDbConnection>();
                    context.Database.Migrate();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Ошибка при применении миграций: {ex.Message}");
                }
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("AllowReactApp");

            app.UseAuthentication(); // Добавлено
            app.UseAuthorization();

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