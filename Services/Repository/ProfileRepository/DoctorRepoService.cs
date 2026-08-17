using AutoMapper;
using Middleware.AppoitnmentFiltrator;
using Middleware.Mapper.ProfileDto;
using Middleware.Mapper.ServicesDto;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using System.Linq.Expressions;

namespace Middleware.Repository.ProfileRepository
{
    public class DoctorRepoService : RepositoryService<Doctor, DoctorDto> , IFilterableRepoService<DoctorDto>
    {
        private DoctorRepo _doctorRepo;
        public DoctorRepoService(DoctorRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _doctorRepo = repo;
        }

        virtual public List<DoctorDto> GetAll(string name)
        {
            var response = _mapper.Map<List<DoctorDto>>(_doctorRepo.GetAll(name));

            return response;
        }
        virtual public List<DoctorDto> GetAll(IQueryable<Doctor> query)
        {
            var response = _mapper.Map<List<DoctorDto>>(_doctorRepo.GetAll(query));

            return response;
        }
        virtual public DoctorDto GetByAccId (string id)
        {
            var response = _mapper.Map<DoctorDto>(_doctorRepo.GetByAccId(id));

            return response;
        }
    }
}
