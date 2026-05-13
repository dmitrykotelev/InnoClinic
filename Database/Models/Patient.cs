using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace ProfileDatabase.Models
{
    public class Patient : IDataModel
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? MiddleName { get; set; }
        public bool IsLinkedToAccount { get; set; } = false;
        public DateTime DateOfBirth { get; set; }
        public string? AccountId { get; set; }
    }
}
