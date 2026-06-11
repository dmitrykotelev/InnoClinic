using Middleware.Mapper;
using System.ComponentModel.DataAnnotations;

namespace Middleware.Mapper.ServicesDto
{
    public class ServiceCategoryDto : IDto
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public int TimeSlotSize { get; set; }

    }
}
