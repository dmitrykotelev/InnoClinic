using BaseModules.DatabaseClasses;
using ServicesDatabase.Core;
using ServicesDatabase.Models;
using System.Linq.Expressions;
using System.Numerics;

namespace ServicesDatabase.Repository
{
    public class ServiceRepo : Repository<Service>
    {
        public ServiceRepo(ServicesDbConnection database) : base(database) { }
        public List<Service> GetBySpecId (int specId)
        {
            var response = _dbSet.Where(x => x.SpecializationId == specId);
            return response.ToList();
        }
        public List<Service> GetAll(string name)
        {
            var response = _dbSet.Where(x => x.Name.Contains(name)).ToList();

            return response;
        }
        public List<Service> GetAll(IQueryable<Service> query)
        {
            var response = query.ToList();

            return response;
        }
    }
}
