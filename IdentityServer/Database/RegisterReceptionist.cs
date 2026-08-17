using Middleware.Mapper.ProfileDto;
using System.ComponentModel.DataAnnotations;

namespace IdentityServer.Moddels
{
    public class RegisterReceptionist
    {
        [Required(ErrorMessage = "The Email field is required.")]
        [EmailAddress(ErrorMessage = "You've entered an invalid email")]
        public string Email { get; set; }

        public Guid PhotoId { get; set; }

        [Required]
        public ReceptionistProfileDto Profile { get; set; }
    }

    public class ReceptionistProfileDto
    {
        public string AccountId { get; set; }

        [Required(ErrorMessage = "Please, enter the first name")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Please, enter the last name")]
        public string LastName { get; set; }

        public string MiddleName { get; set; }

        [Required(ErrorMessage = "Please, choose the office")]
        public string OfficeId { get; set; }
    }
}
