using FluentValidation;
using Middleware.Mapper.ServicesDto;

namespace Middleware.Validator.ServicesValidators
{
    public class SpecializatioValidator : AbstractValidator<SpecializationDto>
    {
        public SpecializatioValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name for specialization required");
        }
    }
}
