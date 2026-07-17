using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Middleware.AppoitnmentFiltrator
{
    public class Filterable
    {
        public const string Service = "service";
        public const string Doctor = "doctor";
        public const string Specialization = "specialization";
        public const string SpecializationId = "specializationid";
        public const string Date = "date";
        public const string Status = "status";
        public const string Office = "office";
        public const string Patient = "patient";
    }
}
