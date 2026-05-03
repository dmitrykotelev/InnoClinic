using Duende.IdentityServer.Models;
using IdentityServer.Settings;


namespace IdentityServer.Helpers
{
    public static class IdentityConfigHelper
    {
        public static IEnumerable<Client> GetClients(ClientsConfig config)
        {
            return config.Clients.Select(c => new Client
            {
                ClientId = c.ClientId,
                ClientName = c.ClientName,

                AllowedGrantTypes = c.GrantTypes.Contains("Code") ? GrantTypes.Code : GrantTypes.ResourceOwnerPassword,

                ClientSecrets = !string.IsNullOrEmpty(c.Secret)
                    ? new List<Secret> { new Secret(c.Secret.Sha256()) }
                    : new List<Secret>(),

                RequirePkce = c.RequirePkce,
                RequireClientSecret = c.RequireClientSecret,
                AllowOfflineAccess = c.AllowOfflineAccess,

                RedirectUris = c.RedirectUris,
                PostLogoutRedirectUris = c.PostLogoutRedirectUris,
                AllowedCorsOrigins = c.AllowedCorsOrigins,
                AllowedScopes = c.AllowedScopes,

                AlwaysIncludeUserClaimsInIdToken = true
            }).ToList();
        }
    }
}
