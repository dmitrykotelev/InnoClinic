using AppoitmentsDatabase;
using AppoitmentsDatabase.Models;
using AutoMapper;
using Middleware.Mapper.AppoitmentsDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Middleware.Repository.AppoitmentsRepository
{
    public class AppoitmentResultRepoService : RepositoryService<AppoitmentResult, AppoitmentResultDto>
    {
        private AppointmentsResultRepository _appoRepo;
        public AppoitmentResultRepoService(AppointmentsResultRepository repository, IMapper mapper) : base(repository, mapper)
        {
            _appoRepo = repository;
        }

        public AppoitmentResultDto GetByAppoitmentId(string AppoitmentId)
        {
            var response = _appoRepo.GetByAppoitmentId(AppoitmentId);
            return _mapper.Map<AppoitmentResultDto>(response);
        }
    }
}
