using FluentValidation;
using Middleware.Mapper.ProfileDto;

namespace Middleware.Validator.ProfileValidators
{
    public class ReceptionValidator : AbstractValidator<ReceptionDto>
    {
        public ReceptionValidator()
        {
        }
    }
}