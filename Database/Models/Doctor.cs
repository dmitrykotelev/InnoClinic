using BaseModules.DatabaseClasses.DatabaseInterfaces;
using System.ComponentModel.DataAnnotations;

namespace ProfileDatabase.Models
{
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
        public int AccountId { get; set; }
        public int SpecializationId { get; set; }
        public int OfficeId { get; set; }
        public DateTime CareerStartYear {  get; set; }
        public bool Status { get; set; }
    }
}
