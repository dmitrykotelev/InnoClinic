using BaseModules.DatabaseClasses;
using Minio;

namespace Photos_Database
{
    public class PhotosRepository : Repository<Photo>
    {
        public PhotosRepository(MinioClient minio, PhotosDbConnection photosDbConnection) : base(photosDbConnection){ }
    }
}
