
using BaseModules.DatabaseClasses;
using OfficesDatabse.Core;
using OfficesDatabse.Models;

namespace OfficesDatabse
{
    public class OfficeRepository : Repository<Office>
    {
        public OfficeRepository(OfficeDbContext context) : base(context) { }

        public virtual Office GetById(string id)
        {
            var response = _dbSet.Find(id);
            return response;
        }

        public virtual Office Delete(string id)
        {
            Office model = GetById(id);
            var response = _dbSet.Remove(model);

            if (Save())
                return (Office)response.Entity;

            return null;
        }
    }
}
