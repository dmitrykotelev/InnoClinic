using AutoMapper;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using Middleware.Mapper.ProfileDto;
using Azure;

namespace Middleware.Repository.ProfileRepository
{
    public class PatientRepoService : RepositoryService<Patient, PatientDto>
    {
        private readonly PatientRepo _patientRepo;
        public PatientRepoService(PatientRepo repo, IMapper mapper) : base(repo, mapper)
        {
            _patientRepo = repo;
        }
        virtual public PatientDto MatchPatient(PatientDto patientDto)
        {
            var response =  _mapper.Map<PatientDto>(_patientRepo.MatchPatient(_mapper.Map<Patient>(patientDto)).GetAwaiter().GetResult());

            return response;
        }
        virtual public PatientDto GetByAccountId(string id)
        {
            var response = _mapper.Map<PatientDto>(_patientRepo.GetByAccountId(id));
            
            return response;
        }
        virtual public List<PatientDto> GetAll(IQueryable<Patient> query)
        {
            var response = _mapper.Map<List<PatientDto>>(_patientRepo.GetAll(query));

            return response;
        }
    }
}
