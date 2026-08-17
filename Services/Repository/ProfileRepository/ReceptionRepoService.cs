using AutoMapper;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using Middleware.Mapper.ProfileDto;

namespace Middleware.Repository.ProfileRepository
{
    public class ReceptionRepoService : RepositoryService<Reception, ReceptionDto>
    {
        private readonly ReceptionRepo _receptionRepo;
        public ReceptionRepoService(ReceptionRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _receptionRepo = repo;
        }

        public ReceptionDto GetByAccId(string AccId)
        {
            var response = _mapper.Map<ReceptionDto>(_receptionRepo.GetByAccId(AccId));

            return response;
        }
    }
}
