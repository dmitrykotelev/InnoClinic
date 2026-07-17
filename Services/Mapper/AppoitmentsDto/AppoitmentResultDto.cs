using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Middleware.Mapper.AppoitmentsDto
{
    public class AppoitmentResultDto : IDto
    {
        public int Id { get; set; }
        public string Complaints { get; set; }
        public string Conclusion { get; set; }
        public string Recomendations { get; set; }
        public string AppointmentId { get; set; }
    }
}
