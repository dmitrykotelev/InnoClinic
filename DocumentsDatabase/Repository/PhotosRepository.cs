using BaseModules.DatabaseClasses;
using DocumentsDatabase.Models;

namespace DocumentsDatabase
{
    public class PhotosRepository : Repository<Photo>
    {
        public PhotosRepository(DocumentsDbConnection photosDbConnection) : base(photosDbConnection){ }
    }
}
