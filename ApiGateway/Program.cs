using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.IdentityModel.Tokens.Jwt;

namespace ApiGateway
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

            var authenticationProviderKey = "MyAuthKey";

            // === НАСТРОЙКА АДРЕСОВ ДЛЯ DOCKER ===
            var internalIdentityUrl = "http://identityserver:8080";
            var externalIdentityUrl = "http://identity.inno-clinic.com";

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(authenticationProviderKey, options =>
                {
                    // ИСПРАВЛЕНИЕ: Скачиваем настройки безопасности внутри сети Docker
                    options.MetadataAddress = $"{internalIdentityUrl}/.well-known/openid-configuration";
                    options.RequireHttpsMetadata = false;

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        // Проверяем, что токен был выдан именно нашим внешним Identity сервером
                        ValidateIssuer = true,
                        ValidIssuer = externalIdentityUrl,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = false // Если захочешь строгую проверку подписи, поставь true
                    };
                });

            builder.Services.AddOcelot(builder.Configuration);

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
                });
            });

            var app = builder.Build();

            // ВАЖНО: CORS вызывается строго ДО Ocelot, чтобы перехватывать OPTIONS-запросы
            app.UseCors("AllowAll");

            app.UseAuthentication();
            app.UseAuthorization();

            await app.UseOcelot();

            app.Run();
        }
    }
}