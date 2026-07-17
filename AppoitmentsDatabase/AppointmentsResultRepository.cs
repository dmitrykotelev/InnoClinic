using AppoitmentsDatabase.Core;
using AppoitmentsDatabase.Models;
using BaseModules.DatabaseClasses;

namespace AppoitmentsDatabase
{
    public class AppointmentsResultRepository : Repository<AppoitmentResult>
    {
        public AppointmentsResultRepository(AppoitmentDbContext context) : base(context) { }

        public AppoitmentResult GetByAppoitmentId(string AppoitmentId)
        {
            return _dbSet.FirstOrDefault(x => x.AppointmentId == AppoitmentId);
        }
    }
}
