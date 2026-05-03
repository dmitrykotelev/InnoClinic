namespace IdentityServer.Settings
{
    public class ClientsConfig
    {
        public List<ClientEntry> Clients { get; set; } = new();
    }

    public class ClientEntry
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string? Secret { get; set; }
        public List<string> GrantTypes { get; set; } = new();
        public List<string> RedirectUris { get; set; } = new();
        public List<string> PostLogoutRedirectUris { get; set; } = new();
        public List<string> AllowedCorsOrigins { get; set; } = new();
        public List<string> AllowedScopes { get; set; } = new();
        public bool RequirePkce { get; set; } = true;
        public bool RequireClientSecret { get; set; } = false;
        public bool AllowOfflineAccess { get; set; } = false;
    }
}
