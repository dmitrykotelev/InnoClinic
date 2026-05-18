using BaseModules.DatabaseClasses.DatabaseInterfaces;
using System.ComponentModel.DataAnnotations;

namespace ProfileDatabase.Models
{
    public class Patient : IDataModel
    {
        public int Id { get; set; }
        [MaxLength(50)]
        public string FirstName { get; set; }
        [MaxLength(50)]
        public string LastName { get; set; }
        [MaxLength(50)]
        public string? MiddleName { get; set; }
        public bool IsLinkedToAccount { get; set; } = false;
        public DateTime DateOfBirth { get; set; }
        public string? AccountId { get; set; }
    }
}
