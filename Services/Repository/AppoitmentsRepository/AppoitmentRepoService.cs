using AppoitmentsDatabase;
using AppoitmentsDatabase.Models;
using AutoMapper;
using Middleware.Mapper.AppoitmentsDto;
using Middleware.Mapper.ProfileDto;
using ProfileDatabase.Models;
using ProfileDatabase.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Middleware.Repository.AppoitmentsRepository
{
    public class AppoitmentRepoService : RepositoryService<Appoitment,AppointmentDto>
    {
        private AppointmentsRepository _appoRepo;
        public AppoitmentRepoService(AppointmentsRepository repository, IMapper mapper) : base(repository, mapper)
        {
            _appoRepo = repository;
        }

        virtual public List<AppointmentDto> GetAllByDoctorId(int DoctorId)
        {
            var response = _appoRepo.GetAllByDoctorId(DoctorId);
            return _mapper.Map<List<AppointmentDto>>(response);
        }
        virtual public List<AppointmentDto> GetAllByDoctorIdDate(int DoctorId, DateOnly date)
        {
            var response = _appoRepo.GetAllByDoctorIdDate(DoctorId, date);
            return _mapper.Map<List<AppointmentDto>>(response);
        }
        virtual public List<AppointmentDto> GetAll(IQueryable<Appoitment> query)
        {
            var response = _mapper.Map<List<AppointmentDto>>(_appoRepo.GetAll(query));

            return response;
        }
        virtual public AppointmentDto Reshedulle(int id, DateTime date)
        {
            var response = _mapper.Map<AppointmentDto>(_appoRepo.Reshedulle(id, date));

            return response;
        }
        virtual public AppointmentDto Approve(int id)
        {
            var response = _mapper.Map<AppointmentDto>(_appoRepo.Approve(id));

            return response;
        }

        virtual public List<AppointmentDto> GetAllByPatientId(int DoctorId)
        {
            var response = _appoRepo.GetAllByPatientId(DoctorId);
            return _mapper.Map<List<AppointmentDto>>(response);
        }

        virtual public List<AppointmentDto> GetRemindAppointments(DateOnly tomorrow)
        {
            var response = _appoRepo.GetRemindAppointments(tomorrow);
            return _mapper.Map<List<AppointmentDto>>(response);
        }
    }
}
