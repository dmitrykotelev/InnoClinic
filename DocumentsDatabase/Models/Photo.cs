using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace DocumentsDatabase.Models
{
    public class Photo : IDataModel
    {
        public Guid Id { get; set; }
        public string? PhotoUrl { get; set; }
        public DateTime LastUpdate { get; set; }
    }
}
