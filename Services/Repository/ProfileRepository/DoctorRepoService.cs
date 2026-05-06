using AutoMapper;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using Middleware.Mapper.ProfileDto;

namespace Middleware.Repository.ProfileRepository
{
    public class DoctorRepoService : RepositoryService<Doctor, DoctorDto> 
    {
        public DoctorRepoService(DoctorRepo repo, IMapper mapper) : base(repo, mapper) { }
    }
}
