using Microsoft.AspNetCore.Mvc;
using Middleware.Mapper;
using Middleware.Repository.DocumentsRepository;
using Middleware.Uploader;

namespace DocumentsApi.Controllers
{
    [ApiController]
    [Route("Photo")]
    public class PhotosController : Controller
    {
        private IFileUploadService _minioService;
        private PhotosRepositoryService _photosRepo;
        private ILogger _logger;

        public PhotosController(IFileUploadService minioService, PhotosRepositoryService photosRepo, ILogger<PhotosController> logger)
        {
            _minioService = minioService ?? throw new ArgumentNullException(nameof(minioService));
            _photosRepo = photosRepo ?? throw new ArgumentNullException(nameof(photosRepo));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost("UploadPhoto")]
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            using (_logger.BeginScope($"Got Photo Uploading"))
            {
                PhotoDto photoDto = new PhotoDto();
                var response = _photosRepo.Add(photoDto);

                if (!(await _minioService.UploadFileAsync(MinioHelper.BucketName, response.Id.ToString(), file)))
                    return BadRequest("Не удалось загрузить файл в MinIO.");

                var url = await GetPhotoLink(response.Id);
                response.PhotoUrl = url;

                _photosRepo.Update(response);

                return Ok(response.Id);
            }
        }

        [HttpGet("GetPhoto/{photoId}")]
        public async Task<IActionResult> GetPhoto(Guid photoId)
        {
            using (_logger.BeginScope("Got Photo Request for {id}", photoId))
            {
                var response = _photosRepo.GetByGuId(photoId);

                if (response == null)
                    return NotFound();

                if (response.LastUpdate.AddHours(23) > DateTime.Now && !string.IsNullOrEmpty(response.PhotoUrl))
                {
                    return Ok(response.PhotoUrl);
                }

                var url = await _minioService.GetUrl(MinioHelper.BucketName, photoId.ToString());

                response.PhotoUrl = url;
                response.LastUpdate = DateTime.Now;
                _photosRepo.Update(response);

                return Ok(url);
            }
        }

        private async Task<string> GetPhotoLink(Guid photoId)
        {
            using (_logger.BeginScope("Got Photo Request for"))
            {
                var response = _photosRepo.GetByGuId(photoId);

                if (response == null)
                    return null;

                string url = await _minioService.GetUrl(MinioHelper.BucketName, photoId.ToString());

                return url;
            }
        }
    }
}
