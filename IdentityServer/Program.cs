using Duende.IdentityServer.Models;
using IdentityServerDatabase;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using System.Security.Claims;

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
                    new IdentityResources.Phone(),
                };

            public static IEnumerable<ApiScope> ApiScopes =>
                new ApiScope[]
                {
                    new ApiScope("api_scope", "My API")
                };

            public static IEnumerable<Client> Clients =>
                new Client[]
                {
                    new Client
                    {
                        ClientId = "swagger_client",
                        ClientName = "Swagger UI",
                        ClientSecrets = new List<Secret> {new Secret("swagger_client") },
                        AllowedGrantTypes = GrantTypes.Code,
                        RequireClientSecret = false,
                        RequirePkce = true,
                        RedirectUris = {"http://localhost:5225"},
                        AllowedCorsOrigins = { "https://localhost:7196", "http://localhost:5225" },
                        AllowedScopes = { "openid", "profile", "api_scope" }
                    },
                    new Client
                    {
                        ClientId = "react_client",
                        ClientName = "React Application",
            
                        AllowedGrantTypes = GrantTypes.ResourceOwnerPassword,
            
                        RequirePkce = true,

                        RequireClientSecret = false,
                        AllowOfflineAccess = true,
                        AllowedCorsOrigins = { "https://localhost:7196", "http://localhost:5173" },
                        AllowedScopes = { "openid", "profile", "api_scope", "email" },
                        AlwaysIncludeUserClaimsInIdToken = true,

                        Claims = new List<ClientClaim>{new ClientClaim("test","test1")},

                        RedirectUris =
                        {
                            "http://localhost:5173/popup-callback",
                            "http://localhost:5173/callback" 
                        },
            
                        PostLogoutRedirectUris = { "http://localhost:5173/" }
                    }
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

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            SwaggerConfiguration(builder);

            var app = builder.Build();

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

                app.UseSwaggerUI(options =>
                {
                    options.OAuthClientId("swagger_client");
                    options.OAuthUsePkce();
                });

                app.MapGet("/", () => Results.Redirect("/swagger"));
            }
        }

        private static void SetIdentityServerSettings(WebApplicationBuilder builder)
        {
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
                options.Events.RaiseErrorEvents = true;
                options.Events.RaiseInformationEvents = true;
                options.Events.RaiseFailureEvents = true;
                options.Events.RaiseSuccessEvents = true;
                options.EmitStaticAudienceClaim = true;

                options.Authentication.CookieSameSiteMode = SameSiteMode.Lax;
            })
            .AddInMemoryIdentityResources(Config.IdentityResources)
            .AddInMemoryApiScopes(Config.ApiScopes)
            .AddInMemoryClients(Config.Clients)
            .AddAspNetIdentity<AppUser>()
            .AddProfileService<ProfileService>();

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
                                { "openid", "OpenID" },
                                { "profile", "Профиль" },
                                { "api_scope", "Доступ к API" }
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