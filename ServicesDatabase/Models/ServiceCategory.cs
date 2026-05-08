using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace ServicesDatabase.Models
{
    public class ServiceCategory : IDataModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int TimeSlotSize { get; set; }
    }
}
