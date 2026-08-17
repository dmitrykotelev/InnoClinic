using Middleware.Mapper.ProfileDto;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Moddels
{
    public class AdminDoctorRegister
    {
        [Required(ErrorMessage = "The Email field is required.")]
        [EmailAddress(ErrorMessage = "You've entered an invalid email")]
        public string Email { get; set; }

        public Guid PhotoId { get; set; }

        public string Password { get; set; }
        [Required]
        public DoctorDto Profile { get; set; }
    }
}
