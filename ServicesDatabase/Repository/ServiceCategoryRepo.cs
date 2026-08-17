using BaseModules.DatabaseClasses;
using ServicesDatabase.Core;
using ServicesDatabase.Models;

namespace ServicesDatabase.Repository
{
    public class ServiceCategoryRepo : Repository<ServiceCategory>
    {
        public ServiceCategoryRepo(ServicesDbConnection database) : base(database) { }
    }
}
