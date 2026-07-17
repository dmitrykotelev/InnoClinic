using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace ProfileDatabase.Models
{
    public class Account : IDataModel
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public int? Phone { get; set; }
        public bool IsEmailVerified { get; set; }
        public int? PhotoId { get; set; }
        public string CreatedBy { get; set; }
        public string Updatedy { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}
