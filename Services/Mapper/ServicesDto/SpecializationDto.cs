using Middleware.Mapper;

namespace Middleware.Mapper.ServicesDto
{
    public class SpecializationDto : IDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool isActiove { get; set; }

    }
}
