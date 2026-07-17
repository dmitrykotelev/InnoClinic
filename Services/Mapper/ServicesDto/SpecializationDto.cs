using Middleware.Mapper;
using ServicesDatabase.Models;

namespace Middleware.Mapper.ServicesDto
{
    public class SpecializationDto : IDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool isActive { get; set; }

    }
}
