using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IdentityServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [Authorize(AuthenticationSchemes = "OpenIddict.Validation.AspNetCore,Identity.Application")]
        [HttpGet("secure-data")]
        public IActionResult GetSecureData()
        {
            return Ok(new
            {
                Message = "Authorized!",
                User = User.Identity?.Name
            });
        }
    }
}