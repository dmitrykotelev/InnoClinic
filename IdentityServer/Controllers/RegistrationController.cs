using Duende.IdentityModel;
using Duende.IdentityServer;
using IdentityServer.Helpers;
using IdentityServer.Settings;
using IdentityServerDatabase.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text;

namespace IdentityServer.Controllers
{
    [Route("Registration/")]
    [ApiController]
    public class RegistrationController : Controller
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RegistrationController> _logger; 
        private readonly IdentityServerTools _tools;
        public class RegisterModel
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }
            [Required]
            public string Password { get; set; }
        }

        public RegistrationController(UserManager<AppUser> userManager, IConfiguration configuration, ILogger<RegistrationController> logger, IdentityServerTools tools)
        {
            _userManager = userManager ?? throw new ArgumentException(nameof(userManager));
            _configuration = configuration ?? throw new ArgumentException(nameof(configuration));
            _logger = logger ?? throw new ArgumentException(nameof(logger));
            _tools = tools ?? throw new ArgumentException(nameof(tools));
        }

        [HttpPost("reg")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            using (_logger.BeginScope("UserEmail: {UserEmail}", model.Email))
            {
                _logger.LogInformation($"Registration start, Email - ");
                var user = new AppUser { UserName = model.Email, Email = model.Email };
                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    _logger.LogInformation($"Registration Succeed, Email - {user.Email}");
                    var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
                    

                    var values = new { userId = user.Id, code = encodedToken };
                    var confirmationLink = Url.Action(nameof(ConfirmEmail), "Registration", values, protocol: Request.Scheme);

                    _logger.LogInformation($"Created profile creation link for {user.Id} {user.Email}");
                    await _userManager.AddClaimAsync(user, new Claim("create_profile_link", confirmationLink));

                    await SendGmailAsync(model.Email, confirmationLink);



                    return Ok(new { Message = "User Registrated" });
                }

                _logger.LogWarning($"Registration eror - {result.Errors}");
                return BadRequest(result.Errors);
            }
        }

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string? userId, [FromQuery] string? code)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(code))
                return BadRequest();

            using (_logger.BeginScope("UserEmail: {UserEmail}", userId))
            {
                _logger.LogInformation($"Confirm email started: {userId}");

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    return NotFound();

                var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
                var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

                if (result.Succeeded)
                {
                    var claims = new List<Claim>
                    {
                        new Claim(JwtClaimTypes.Subject, user.Id.ToString()),
                        new Claim(JwtClaimTypes.Email, user.Email),
                        new Claim(JwtClaimTypes.Name, user.UserName),

                        new Claim(JwtClaimTypes.ClientId, "react_client"), 
                        new Claim(JwtClaimTypes.Scope, "openid"),
                        new Claim(JwtClaimTypes.Scope, "profile")
                    };

                    var accessToken = await _tools.IssueJwtAsync(lifetime: 3600, claims: claims);

                    var baseUrl = _configuration["FrontendUrls:CreateProfile"];
                    var reactUrl = $"{baseUrl}?token={accessToken}";

                    return Redirect(reactUrl);
                }

                var errorUrl = _configuration["FrontendUrls:Error"];
                return Redirect($"{errorUrl}?message=EmailConfirmationFailed");
            }
        }

        private async Task SendGmailAsync(string targetEmail, string message)
        {
            var emailSettings = _configuration.GetSection("EmailSettings").Get<EmailSettings>()
                                ?? new EmailSettings();

            await EmailHelper.SendGmailAsync(emailSettings, targetEmail, message);
        }
    }
}