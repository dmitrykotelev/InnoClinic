using BaseModules.DatabaseClasses.DatabaseInterfaces;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace ProfileDatabase.Models
{
    [Index(nameof(FirstName), Name = "Doctor_Name")]
    public class Doctor : IDataModel
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }
        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }
        [MaxLength(50)]
        public string? MiddleName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string AccountId { get; set; }
        public int SpecializationId { get; set; }
        public string OfficeId { get; set; }
        public DateTime CareerStartYear {  get; set; }
        public bool Status { get; set; }
    }
}
