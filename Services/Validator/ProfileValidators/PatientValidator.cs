using FluentValidation;
using Middleware.Mapper.ProfileDto;

namespace Middleware.Validator.ProfileValidators
{
    public class PatientValidator : AbstractValidator<PatientDto>
    {
        public PatientValidator()
        {
        }
    }
}