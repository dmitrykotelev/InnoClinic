using AccountDatabase.Core;
using BaseModules.DatabaseClasses;
using ProfileDatabase.Models;

namespace AccountDatabase
{
    public class AccountRepo : Repository<Account>
    {
        public AccountRepo(AccountDbConnection databaseCore) : base(databaseCore) { }
    }
}