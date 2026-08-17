using Duende.IdentityServer.Models;
using IdentityServer.Database;
using IdentityServer.Helpers;
using IdentityServer.IdentityServices;
using IdentityServer.Settings;
using IdentityServerDatabase;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

namespace IdentityServer
{
    public class Program
    {
        public static class Config
        {
            public static IEnumerable<IdentityResource> IdentityResources =>
                new IdentityResource[]
                {
                    new IdentityResources.OpenId(),
                    new IdentityResources.Profile(),
                    new IdentityResources.Email(),
                    new IdentityResource("roles", "User roles", new[] { ScopesConfig.Role }),
                    new IdentityResources.Phone(),
                    new IdentityResource(
                        name: "custom_profile",
                        userClaims: new[] { "create_profile_link" }
                        )
                };

            public static IEnumerable<ApiScope> ApiScopes =>
                new ApiScope[]
                {
                    new ApiScope(ScopesConfig.ApiScope, "My API", new[] { ScopesConfig.Role})
                };
        }

        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            //////////////
            /// DuendeServer
            //////////////
            SetIdentityServerSettings(builder);

            builder.Services.AddLocalApiAuthentication();

            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddRazorPages();
            builder.Services.AddHttpContextAccessor();

            builder.Services.AddTransient<Duende.IdentityServer.IdentityServerTools>();

            // ИСПРАВЛЕНИЕ 1: Внутренний адрес контейнера ProfilesApi в сети Docker
            builder.Services.AddHttpClient("ProfilesApi", client =>
            {
                client.BaseAddress = new Uri("http://profilesapi:8080");
            });

            var corsSettings = builder.Configuration.GetSection("CorsSettings").Get<CorsSettings>();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", policy =>
                {
                    if (corsSettings?.AllowedOrigins != null && corsSettings.AllowedOrigins.Length > 0)
                    {
                        policy.WithOrigins(corsSettings.AllowedOrigins)
                              .AllowAnyHeader()
                              .AllowAnyMethod();
                    }
                });
            });

            SwaggerConfiguration(builder);

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<IdentityDbConnection>();

                    Console.WriteLine("\n=== [1/3] Ожидание SQL Server... ===");
                    Thread.Sleep(3000);

                    Console.WriteLine("=== [2/3] Создание базы IdentityDb (EnsureCreated)... ===");
                    context.Database.EnsureCreated();

                    Console.WriteLine("=== [3/3] Добавление базовых ролей... ===");
                    IdentityServer.Database.DatabaseSeeder.SeedRolesAsync(services).GetAwaiter().GetResult();

                    Console.WriteLine("=== ГОТОВО! IDENTITY ИНИЦИАЛИЗИРОВАН! ===\n");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\n=== ФАТАЛЬНАЯ ОШИБКА ИНИЦИАЛИЗАЦИИ IDENTITY ===\n{ex.Message}\n{ex.StackTrace}\n");
                }
            }

            app.UseStaticFiles();
            app.UseRouting();

            SwaggerOptions(app);

            app.UseCors("AllowReactApp");

            app.UseIdentityServer();
            app.UseAuthorization();

            app.MapControllers();
            app.MapRazorPages();

            app.Run();
        }

        private static void SwaggerOptions(WebApplication app)
        {
            if (app.Environment.IsDevelopment())
            {
                app.Use(async (context, next) =>
                {
                    if (context.Request.Path.StartsWithSegments("/swagger/v1/swagger.json"))
                    {
                        var originalBodyStream = context.Response.Body;
                        using var responseBody = new MemoryStream();
                        context.Response.Body = responseBody;

                        await next();

                        context.Response.Body = originalBodyStream;
                        responseBody.Seek(0, SeekOrigin.Begin);
                        var json = await new StreamReader(responseBody).ReadToEndAsync();

                        json = json.Replace("\"openapi\": \"3.0.4\"", "\"openapi\": \"3.0.1\"");

                        context.Response.Headers.ContentLength = null;
                        await context.Response.WriteAsync(json);
                        return;
                    }

                    await next();
                });

                app.UseSwagger();

                if (app.Environment.IsDevelopment())
                {
                    app.UseSwaggerUI(options =>
                    {
                        options.OAuthClientId("swagger_client");
                        options.OAuthUsePkce();
                    });

                    app.MapGet("/", () => Results.Redirect("/swagger"));
                }
            }
        }

        private static void SetIdentityServerSettings(WebApplicationBuilder builder)
        {
            var clientConfig = builder.Configuration
                .GetSection("IdentityConfiguration")
                .Get<ClientsConfig>();
            var clients = IdentityConfigHelper.GetClients(clientConfig ?? new ClientsConfig());

            builder.Services.AddDbContext<IdentityDbConnection>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
            {
                if (builder.Environment.IsDevelopment())
                {
                    options.Password.RequireDigit = false;
                    options.Password.RequireLowercase = false;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequireUppercase = false;
                }
            })
            .AddEntityFrameworkStores<IdentityDbConnection>()
            .AddDefaultTokenProviders();

            builder.Services.AddIdentityServer(options =>
            {
                // ИСПРАВЛЕНИЕ 3: Отключаем запись ключей на жесткий диск
                // Это устраняет ошибку UnauthorizedAccessException в /app/keys/
                options.KeyManagement.Enabled = false;

                options.Events.RaiseErrorEvents = true;
                options.Events.RaiseInformationEvents = true;
                options.Events.RaiseFailureEvents = true;
                options.Events.RaiseSuccessEvents = true;
                options.EmitStaticAudienceClaim = true;

                // Внешний адрес оставляем без изменений, так как он идет в токены
                options.IssuerUri = "http://identity.inno-clinic.com";

                options.Authentication.CookieSameSiteMode = SameSiteMode.Lax;
            })
            .AddInMemoryIdentityResources(Config.IdentityResources)
            .AddInMemoryApiScopes(Config.ApiScopes)
            .AddInMemoryClients(clients)
            .AddAspNetIdentity<AppUser>()
            .AddProfileService<ProfileService>()
            .AddDeveloperSigningCredential(); // Генерируем ключ прямо в памяти

            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.Name = "IdentityServer.Cookie";
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            });
        }

        private static void SwaggerConfiguration(WebApplicationBuilder builder)
        {
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.OAuth2,
                    Flows = new OpenApiOAuthFlows
                    {
                        AuthorizationCode = new OpenApiOAuthFlow
                        {
                            AuthorizationUrl = new Uri("/connect/authorize", UriKind.Relative),
                            TokenUrl = new Uri("/connect/token", UriKind.Relative),
                            Scopes = new Dictionary<string, string>
                            {
                                { ScopesConfig.OpenId, "OpenID" },
                                { ScopesConfig.Profile, "Профиль" },
                                { ScopesConfig.ApiScope, "Доступ к API" }
                            }
                        }
                    }
                });
                options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("oauth2", document)] = new List<string> { "api_scope" }
                });
            });
        }
    }
}