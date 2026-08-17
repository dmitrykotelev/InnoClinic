using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Middleware.Repository.ProfileRepository;
using System.Security.Claims;

namespace ProfilesApi.Controllers
{
    [ApiController]
    [Route("ReceptionAuthorize/")]
    public class ReceptionAuthorizeController : Controller
    {
        private readonly ReceptionRepoService _receptionRepoService;

        public ReceptionAuthorizeController(ReceptionRepoService receptionRepoService)
        {
            _receptionRepoService = receptionRepoService;
        }

        [HttpGet("Me")]
        [Authorize(Roles = "receptionist")]
        public async Task<IActionResult> GetMyReceptionistProfile()
        {
            var accountId = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(accountId))
                return BadRequest("Не удалось извлечь Account ID из токена");

            var receptionist = _receptionRepoService.GetByAccId(accountId);

            if (receptionist == null)
                return NotFound("У данного аккаунта работника не существует профиля, скорее всего аккаунт создан некорректно");

            return Ok(new
            {
                Id = receptionist.Id,
                FirstName = receptionist.FirstName,
                LastName = receptionist.LastName,
                MiddleName = receptionist.MiddleName,
                AccountId = accountId,
                OfficeId = receptionist.OfficeId,
                Role = "receptionist"
            });
        }

    }
}
