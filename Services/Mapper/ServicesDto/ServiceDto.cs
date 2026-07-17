using Middleware.Mapper;
using System.ComponentModel.DataAnnotations;

namespace Middleware.Mapper.ServicesDto
{
    public class ServiceDto : IDto
    {
        public int Id { get; set; }
        [Required]
        public int ServiceCategoryId { get; set; }
        [Required]
        public string Name { get; set; }
        public float Price { get; set; }
        public int SpecializationId { get; set; }
        public bool isActive { get; set; }

    }
}
