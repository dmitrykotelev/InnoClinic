using BaseModules.DatabaseClasses.DatabaseInterfaces;
using System.ComponentModel.DataAnnotations;

namespace ServicesDatabase.Models
{
    public class Service : IDataModel
    {
        public int Id { get; set; }
        public int ServiceCategoryId { get; set; }
        [Required]
        public string Name { get; set; }
        public int SpecializationId { get; set; }
        public bool isActive { get; set; }
    }
}
