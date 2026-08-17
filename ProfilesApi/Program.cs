using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Middleware.Mapper;
using Middleware.Repository.ProfileRepository;
using Middleware.Validator.ProfileValidators;
using ProfileDatabase.Core;
using ProfileDatabase.Repository;
using System.IdentityModel.Tokens.Jwt;


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
                                     x => x.MigrationsAssembly("ProfileDatabase"))
                       .ConfigureWarnings(warnings => warnings.Ignore())
            );

            builder.Services.AddAutoMapper(cfg => { }, typeof(MapperProfile).Assembly);

            AddRepos(builder);
            AddRepoServices(builder);
            AddValidators(builder);

            // === НАСТРОЙКА АДРЕСОВ ===
            var internalIdentityUrl = "http://identityserver:8080";
            var externalIdentityUrl = "http://identity.inno-clinic.com";

            // МЫ УДАЛИЛИ РУЧНОЕ СКАЧИВАНИЕ КЛЮЧЕЙ
            // AddJwtBearer сделает это сам, причем элегантно и с повторными попытками
            builder.Services.AddAuthentication("Bearer")
                .AddJwtBearer("Bearer", options =>
                {
                    options.MetadataAddress = $"{internalIdentityUrl}/.well-known/openid-configuration";
                    options.RequireHttpsMetadata = false;
                    options.MapInboundClaims = false;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateAudience = false,
                        ValidateIssuer = false,
                        ValidateIssuerSigningKey = false,
                        RequireSignedTokens = false,

                        RoleClaimType = "role",
                        NameClaimType = "name",

                        ValidateLifetime = true,
                        SignatureValidator = delegate (string token, TokenValidationParameters parameters)
                        {
                            return new Microsoft.IdentityModel.JsonWebTokens.JsonWebToken(token);
                        }
                    };
                });

            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

            builder.Services.AddAuthorization();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                try
                {
                    var context = scope.ServiceProvider.GetRequiredService<ProfileDbConnection>();

                    context.Database.EnsureCreated();

                    Console.WriteLine("\n=== БАЗА ДАННЫХ PROFILES УСПЕШНО СОЗДАНА! ===\n");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\n=== ОШИБКА СОЗДАНИЯ БАЗЫ PROFILES: {ex.Message} ===\n");
                }
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("AllowReactApp");

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }

        private static void AddRepos(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<DoctorRepo>();
            builder.Services.AddTransient<PatientRepo>();
            builder.Services.AddTransient<ReceptionRepo>();
        }

        private static void AddValidators(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<DoctorValidator>();
            builder.Services.AddTransient<PatientValidator>();
            builder.Services.AddTransient<ReceptionValidator>();
        }

        private static void AddRepoServices(WebApplicationBuilder builder)
        {
            builder.Services.AddTransient<DoctorRepoService>();
            builder.Services.AddTransient<PatientRepoService>();
            builder.Services.AddTransient<ReceptionRepoService>();
        }
    }
}