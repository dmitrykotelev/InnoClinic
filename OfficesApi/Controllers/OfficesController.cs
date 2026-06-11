using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.OfficesDto;
using Middleware.Repository.OfficeRepositoryService;
using Middleware.Validator.OfficeValidator;
using OfficesDatabse.Models;

namespace OfficesApi.Controllers
{
    [ApiController]
    [Route("Offices/")]
    public class OfficesController : BaseController<Office,OfficeDto>
    {
        public OfficesController(OfficeRepositoryService repo, OfficeValidator validator, ILogger<OfficesController> logger) : base(repo,validator,logger) { }
    }
}
