using BaseModules.DatabaseClasses.DatabaseInterfaces;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ServicesDatabase.Models
{
    [Index(nameof(Name), Name = "Specialization_Name")]
    public class Specialization : IDataModel
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        public bool isActiove { get; set; }
    }
}
