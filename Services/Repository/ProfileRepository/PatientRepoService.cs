using AutoMapper;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using Middleware.Mapper.ProfileDto;

namespace Middleware.Repository.ProfileRepository
{
    public class PatientRepoService : RepositoryService<Patient, PatientDto>
    {
        private readonly PatientRepo _patientRepo;
        public PatientRepoService(PatientRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _patientRepo = repo;
        }
        public List<PatientDto> GetAllByName(string name)
        {
            var response = _mapper.Map<List<PatientDto>>(_patientRepo.GetAllByName(name));

            return response;
        }
        public List<PatientDto> GetAllBySecondName(string secondName)
        {
            var response = _mapper.Map<List<PatientDto>>(_patientRepo.GetAllBySecondName(secondName));

            return response;
        }
        public PatientDto GetByAccountId(string id)
        {
            var response = _mapper.Map<PatientDto>(_patientRepo.GetByAccountId(id));
            
            return response;
        }
    }
}
