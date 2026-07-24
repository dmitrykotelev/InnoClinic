using AutoMapper;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper.ServicesDto;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;

namespace Middleware.Repository.ServicesRepository
{
    public class ServicesRepoService : RepositoryService<Service,ServiceDto> , IFilterableRepoService<ServiceDto>
    {
        ServiceRepo _serviceRepo;
        public ServicesRepoService(ServiceRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _serviceRepo = repo;
        }
        virtual public List<ServiceDto> GetBySpecId(int specId)
        {
            var response = _mapper.Map<List<ServiceDto>>(_serviceRepo.GetBySpecId(specId));

            return response;
        }
        public List<ServiceDto> GetAll(string name)
        {
            var response = _mapper.Map<List<ServiceDto>>(_serviceRepo.GetAll(name));

            return response;
        }
        virtual public List<ServiceDto> GetAll(IQueryable<Service> query)
        {
            var response = _mapper.Map<List<ServiceDto>>(_serviceRepo.GetAll(query));

            return response;
        }
    }
}
