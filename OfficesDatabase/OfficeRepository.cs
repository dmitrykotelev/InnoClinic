
using BaseModules.DatabaseClasses;
using OfficesDatabse.Core;
using OfficesDatabse.Models;

namespace OfficesDatabse
{
    public class OfficeRepository : Repository<Office>
    {
        public OfficeRepository(OfficeDbContext context) : base(context) { }
    }
}
