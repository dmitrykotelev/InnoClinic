using AutoMapper;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;

namespace Middleware.Repository.ServicesRepository
{
    public class ServicesCategoriesRepoService : RepositoryService<ServiceCategory,ServiceCategoryDto>
    {
        public ServicesCategoriesRepoService(ServiceCategoryRepo repo, IMapper mapper) : base(repo, mapper) { }
    }
}
