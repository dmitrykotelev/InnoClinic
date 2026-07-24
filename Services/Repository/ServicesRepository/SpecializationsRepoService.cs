using AutoMapper;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;

namespace Middleware.Repository.ServicesRepository
{
    public class SpecializationsRepoService : RepositoryService<Specialization,SpecializationDto> , IFilterableRepoService<SpecializationDto>
    {
        private SpecializationRepo _specRepo;
        public SpecializationsRepoService(SpecializationRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _specRepo = repo;
        }

        virtual public List<SpecializationDto> GetAll(string name)
        {
            var response = _mapper.Map<List<SpecializationDto>>(_specRepo.GetAll(name));

            return response;
        }
    }
}
