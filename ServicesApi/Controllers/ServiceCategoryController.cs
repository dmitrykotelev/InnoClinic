using BaseApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository.ServicesRepository;
using Middleware.Validator.ServicesValidators;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;

namespace ServicesApi.Controllers
{
    [ApiController]
    [Route("ServiceCategories")]
    public class ServiceCategoryController : BaseController<ServiceCategory,ServiceCategoryDto>
    {
        
        public ServiceCategoryController(ServicesCategoriesRepoService repo, ServiceCategoriesValidator validator, ILogger<ServiceCategoryController> logger) : base(repo, validator, logger)
        {
        }
    }
}
