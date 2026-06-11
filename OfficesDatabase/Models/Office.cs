using BaseModules.DatabaseClasses.DatabaseInterfaces;
using MongoDB.EntityFrameworkCore;

namespace OfficesDatabse.Models
{
    [Collection("appointments")]
    public class Office : IDataModel
    {
        public int Id { get; set; }
        public string Adress { get; set; }
        public Guid PhotoId { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
    }
}
