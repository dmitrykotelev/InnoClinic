using AppoitmentsDatabase.Core;
using AppoitmentsDatabase.Models;
using BaseModules.DatabaseClasses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace AppoitmentsDatabase
{
    public class AppointmentsRepository : Repository<Appoitment>
    {
        public AppointmentsRepository(AppoitmentDbContext context) : base(context) { }

        public virtual List<Appoitment> GetAllByDoctorId(int DoctorId)
        {
            return _dbSet.Where(x => x.DoctorId == DoctorId).ToList();
        }
        public List<Appoitment> GetAllByDoctorIdDate(int DoctorId, DateOnly date)
        {
            return _dbSet.Where(x => x.DoctorId == DoctorId && x.Date == date).ToList();
        }
        public List<Appoitment> GetAll(IQueryable<Appoitment> query)
        {
            var response = query.ToList();

            return response;
        }

        public virtual Appoitment Reshedulle(int id, DateTime date)
        {
            var response = _dbSet.Find(id);
            response.Date = DateOnly.FromDateTime(date);
            response.Time = TimeOnly.FromDateTime(date);

            _dbSet.Update(response);

            if (Save())
                return response;

            return null;

        }

        public Appoitment Approve(int id)
        {
            var response = _dbSet.Find(id);
            response.IsApproved = true;

            _dbSet.Update(response);

            if (Save())
                return response;

            return null;

        }

        public List<Appoitment> GetAllByPatientId(int PatientId)
        {
            return _dbSet.Where(x => x.PatientId == PatientId).ToList();
        }

        public List<Appoitment> GetRemindAppointments(DateOnly tomorrow)
        {
            return _dbSet.Where(a => a.Date == tomorrow
                    && !a.IsReminded
                    && a.IsApproved).ToList();
        }
    }
}
