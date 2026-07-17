using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Middleware.Mapper.OfficesDto
{
    public class OfficeDto : IDto
    {
        public string Id { get; set; }
        public string Adress { get; set; }
        public Guid PhotoId { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
    }
}
