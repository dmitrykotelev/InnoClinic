using ProfileDatabase.Core;
using BaseModules.DatabaseClasses;
using ProfileDatabase.Models;

namespace ProfileDatabase.Repository
{
    public class DoctorRepo : Repository<Doctor>
    {
        public DoctorRepo(ProfileDbConnection databaseCore) : base(databaseCore) { }

        public List<Doctor> GetAll(string name)
        {
            var response = _dbSet.Where(x => x.FirstName.Contains(name)).ToList();

            return response;
        }
        public List<Doctor> GetAll(IQueryable<Doctor> query)
        {
            var response = query.ToList();

            return response;
        }
    }
}