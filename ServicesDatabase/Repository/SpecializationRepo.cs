using BaseModules.DatabaseClasses;
using ServicesDatabase.Core;
using ServicesDatabase.Models;
using System.Numerics;

namespace ServicesDatabase.Repository
{
    public class SpecializationRepo : Repository<Specialization>
    {
        public SpecializationRepo(ServicesDbConnection database) : base(database) { }

        public List<Specialization> GetAll(string name)
        {
            var response = _dbSet.Where(x => x.Name.Contains(name)).ToList();

            return response;
        }
    }
}
