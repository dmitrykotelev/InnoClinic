using BaseModules.DatabaseClasses;
using ServicesDatabase.Core;
using ServicesDatabase.Models;

namespace ServicesDatabase.Repository
{
    public class SpecializationRepo : Repository<Specialization>
    {
        public SpecializationRepo(ServicesDbConnection database) : base(database) { }
    }
}
