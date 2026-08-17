using Middleware.Mapper.ProfileDto;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Database
{
    public class RegisterDoctor
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public DoctorDto Profile { get; set; }
        [Required]
        public Guid PhotoId { get; set; }
    }
}
