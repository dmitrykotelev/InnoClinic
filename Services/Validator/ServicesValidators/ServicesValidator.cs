using FluentValidation;
using Middleware.Mapper.ServicesDto;

namespace Middleware.Validator.ServicesValidators
{
    public class ServicesValidator : AbstractValidator<ServiceDto>
    {
        public ServicesValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name for service required");
        }
    }
}
