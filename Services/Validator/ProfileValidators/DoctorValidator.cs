using FluentValidation;
using Middleware.Mapper.ProfileDto;

namespace Middleware.Validator.ProfileValidators
{
    public class DoctorValidator : AbstractValidator<DoctorDto>
    {
        public DoctorValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("Имя обязательно для заполнения.");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Фамилия обязательна для заполнения.");

            RuleFor(x => x.DateOfBirth)
                .NotEmpty().WithMessage("Дата рождения обязательна.")
                .LessThan(DateTime.Now.AddYears(-18)).WithMessage("Врач должен быть старше 18 лет.");

            RuleFor(x => x.CareerStartYear)
                .NotEmpty().WithMessage("Дата начала карьеры обязательна.")
                .LessThanOrEqualTo(DateTime.Now).WithMessage("Дата начала карьеры не может быть в будущем.")
                .GreaterThan(x => x.DateOfBirth.AddYears(18)).WithMessage("Дата начала карьеры некорректна относительно даты рождения.");
        }
    }
}