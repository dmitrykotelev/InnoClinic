using AppoitmentsDatabase.Core;
using AppoitmentsDatabase.Models;
using BaseModules.DatabaseClasses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppoitmentsDatabase
{
    public class AppointmentsRepository : Repository<Appoitment>
    {
        public AppointmentsRepository(AppoitmentDbContext context) : base(context) { }

        public List<Appoitment> GetAllByDoctor(int DoctorId)
        {
            return _dbSet.Where(x => x.DoctorId == DoctorId).ToList();
        }
        public List<Appoitment> GetAllByDoctor(int DoctorId, DateOnly date)
        {
            return _dbSet.Where(x => x.DoctorId == DoctorId && x.Date == date).ToList();
        }
    }
}
