using BaseModules.DatabaseClasses.DatabaseInterfaces;
using System.ComponentModel.DataAnnotations;

namespace ServicesDatabase.Models
{
    public class Specialization : IDataModel
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public bool isActiove { get; set; }
    }
}
