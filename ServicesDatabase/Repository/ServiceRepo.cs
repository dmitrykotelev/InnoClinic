using BaseModules.DatabaseClasses;
using ServicesDatabase.Core;
using ServicesDatabase.Models;

namespace ServicesDatabase.Repository
{
    public class ServiceRepo : Repository<Service>
    {
        public ServiceRepo(ServicesDbConnection database) : base(database) { }
    }
}
