using ProfileDatabase.Core;
using BaseModules.DatabaseClasses;
using ProfileDatabase.Models;

namespace ProfileDatabase.Repository
{
    public class DoctorRepo : Repository<Doctor>
    {
        public DoctorRepo(ProfileDbConnection databaseCore) : base(databaseCore) { }
    }
}