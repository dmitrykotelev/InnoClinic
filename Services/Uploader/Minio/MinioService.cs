using Microsoft.AspNetCore.Http;
using Minio;
using Minio.DataModel.Args;

namespace Middleware.Uploader.Minio
{
    public class MinioService : IFileUploadService
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

            bool bExists = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));
            if (!bExists)
            {
                await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
                Console.WriteLine($"=== Бакет '{bucketName}' был успешно создан в MinIO! ===");
            }

            var response = await _minioClient.PutObjectAsync(putArgs);

            if (response == null)
                return false;

            return true;
        }

        public async Task<MemoryStream> GetFileStreamAsync(string bucketName, string photoName)
        {
            var memoryStream = new MemoryStream();
            var args = new GetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(photoName)
                .WithCallbackStream((stream) =>
                {
                    stream.CopyTo(memoryStream);
                });

            await _minioClient.GetObjectAsync(args);
            memoryStream.Position = 0;

            return memoryStream;
        }

        public async Task<string> GetUrl(string bucketName, string photoName)
        {
            var args = new PresignedGetObjectArgs()
                .WithBucket(bucketName)
                .WithObject(photoName)
                .WithExpiry(60 * 60 * 24);

            var internalUrl = await _minioClient.PresignedGetObjectAsync(args);

            var publicUrl = internalUrl.Replace("http://minio:9000", "https://gateway.inno-clinic.com/s3");

            return publicUrl;
        }
    }
}
