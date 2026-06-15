using BaseModules.DatabaseClasses.DatabaseInterfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace AppoitmentsDatabase.Models
{
    public class Appoitment : IDataModel
    {
        public int Id { get; set; }
        public string PatientId { get; set; }
        public int DoctorId { get; set; }
        public int ServiceId { get; set; }
        public DateOnly Date { get; set; }
        public TimeOnly Time { get; set; }
        public bool IsApproved { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
