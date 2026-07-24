using Microsoft.AspNetCore.Http;
using Minio.DataModel.Args;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Middleware.Uploader
{
    public interface IFileUploadService
    {
        public Task<bool> UploadFileAsync(string bucketName, string fileName, IFormFile file);
        public Task<string> GetUrl(string bucketName, string photoName);
        public Task<MemoryStream> GetFileStreamAsync(string bucketName, string photoName);
    }
}
