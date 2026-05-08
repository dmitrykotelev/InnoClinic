using AutoMapper;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;

namespace Middleware.Repository.ServicesRepository
{
    public class ServicesRepoService : RepositoryService<Service,ServiceDto>
    {
        public ServicesRepoService(ServiceRepo repo, IMapper mapper) : base(repo, mapper) { }
    }
}
