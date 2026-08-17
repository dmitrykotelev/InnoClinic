using Microsoft.EntityFrameworkCore;
using ProfileDatabase.Core;

namespace Photos_Database
{
    public class PhotosDbConnection : DbContext
    {
        public DbSet<Photo> Photos { get; set; }
        public PhotosDbConnection(DbContextOptions<ProfileDbConnection> options)
            : base(options) { }
    }
}
