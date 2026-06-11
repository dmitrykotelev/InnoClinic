using AutoMapper;
using DocumentsDatabase;
using DocumentsDatabase.Models;
using Middleware.Mapper;

namespace Middleware.Repository.DocumentsRepository
{
    public class PhotosRepositoryService : RepositoryService<Photo,PhotoDto>
    {
        public PhotosRepositoryService(PhotosRepository repo, IMapper mapper) : base(repo, mapper) { }
    }
}
