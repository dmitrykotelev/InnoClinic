using DocumentsDatabase.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentsDatabase
{
    public class DocumentsDbConnection : DbContext
    {
        public DbSet<Photo> Photos { get; set; }
        public DocumentsDbConnection(DbContextOptions<DocumentsDbConnection> options)
            : base(options) { }
    }
}
