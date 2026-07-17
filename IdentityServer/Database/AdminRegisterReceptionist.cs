using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Moddels
{
    public class AdminRegisterReceptionist
    {
        [Required(ErrorMessage = "The Email field is required.")]
        [EmailAddress(ErrorMessage = "You've entered an invalid email")]
        public string Email { get; set; }

        public Guid PhotoId { get; set; }

        public string Password { get; set; }
        [Required]
        public ReceptionistProfileDto Profile { get; set; }
    }
}
