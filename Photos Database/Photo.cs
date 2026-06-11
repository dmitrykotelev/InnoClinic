using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace Photos_Database
{
    public class Photo : IDataModel
    {
        public int Id { get; set; }
        public Uri PhotoUrl { get; set; }
    }
}
