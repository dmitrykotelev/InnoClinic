using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace ProfileDatabase.Models
{
    public class Reception : IDataModel
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? MiddleName { get; set; }
        public string AccountId { get; set; }
        public string OfficeId { get; set; }
    }
}
