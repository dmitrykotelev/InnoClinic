using Microsoft.AspNetCore.Http;
using Minio;
using Minio.DataModel.Args;

namespace Middleware.Minio
{
    public class MinioService
    {
        private readonly IMinioClient _minioClient;
            
        public MinioService(IMinioClient minioClient)
        {
            _minioClient = minioClient;
        }

        public async Task<bool> UploadFileAsync(string bucketName, string fileName, IFormFile file)
        {
            var beArgs = new BucketExistsArgs().WithBucket(bucketName);
            using var stream = file.OpenReadStream();


            var putArgs = new PutObjectArgs()
                .WithBucket(bucketName)
                .WithObject(fileName)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(file.ContentType);

            var response = await _minioClient.PutObjectAsync(putArgs);

            if (response == null)
                return false;

            return true;
        }

        public async Task<string> GetUrl(string bucketName, string photoName)
        {
            var args = new PresignedGetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(photoName)
                .WithExpiry(60 * 60 * 24);

            var Url = await _minioClient.PresignedGetObjectAsync(args);

            return Url;
        }
    }
}
