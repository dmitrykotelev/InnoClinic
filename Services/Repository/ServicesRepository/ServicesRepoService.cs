using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper.ProfileDto;
using Middleware.Mapper.ServicesDto;
using Middleware.Repository;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using ServicesDatabase.Models;
using ServicesDatabase.Repository;
using System.Linq.Expressions;

namespace Middleware.Repository.ServicesRepository
{
    public class ServicesRepoService : RepositoryService<Service,ServiceDto> , IFilterableRepoService<ServiceDto>
    {
        ServiceRepo _serviceRepo;
        public ServicesRepoService(ServiceRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _serviceRepo = repo;
        }
        public List<ServiceDto> GetBySpec(int specId)
        {
            var response = _mapper.Map<List<ServiceDto>>(_serviceRepo.GetBySpec(specId));

            return response;
        }
        public List<ServiceDto> GetAll(string name)
        {
            var response = _mapper.Map<List<ServiceDto>>(_serviceRepo.GetAll(name));

            return response;
        }
        public List<ServiceDto> GetAll(IQueryable<Service> query)
        {
            var response = _mapper.Map<List<ServiceDto>>(_serviceRepo.GetAll(query));

            return response;
        }
    }
}
