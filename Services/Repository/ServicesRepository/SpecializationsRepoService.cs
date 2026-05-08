using AutoMapper;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;

namespace Middleware.Repository.ServicesRepository
{
    public class SpecializationsRepoService : RepositoryService<Specialization,SpecializationDto>
    {
        public SpecializationsRepoService(SpecializationRepo repo, IMapper mapper) : base(repo, mapper) { }
    }
}
