using Microsoft.EntityFrameworkCore;
using ProfileDatabase.Models;

namespace AccountDatabase.Core
{
    public class AccountDbConnection : DbContext
    {
        public DbSet<Account> Accounts { get; set; }

        public AccountDbConnection(DbContextOptions<AccountDbConnection> options)
            : base(options) { }
    }
}
