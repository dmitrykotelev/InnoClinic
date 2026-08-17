using BaseModules.DatabaseClasses.DatabaseInterfaces;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.EntityFrameworkCore;

namespace OfficesDatabse.Models
{
    [Collection("Offices")]
    public class Office : IDataModel
    {
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        public string Adress { get; set; }
        public Guid PhotoId { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
    }
}
