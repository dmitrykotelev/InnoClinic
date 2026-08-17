using ProfileDatabase.Core;
using ProfileDatabase.Models;
using BaseModules.DatabaseClasses;


namespace ProfileDatabase.Repository
{
    public class ReceptionRepo : Repository<Reception>
    {
        public ReceptionRepo(ProfileDbConnection databaseCore) : base(databaseCore) { }

        public Reception GetByAccId(string AccId)
        {
            var response = _dbSet.Where(x => x.AccountId == AccId).First();

            return response;
        }
    }
}