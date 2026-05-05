using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace ProfileDatabase.Models
{
    public class Doctor : IDataModel
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? MiddleName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int AccountId { get; set; }
        public int SpecializationId { get; set; }
        public int OfficeId { get; set; }
        public DateTime CareerStartYear {  get; set; }
        public bool Status { get; set; }
    }
}
