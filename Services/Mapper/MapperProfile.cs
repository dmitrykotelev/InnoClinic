using AutoMapper;
using Middleware.Mapper.ServicesDto;
using ProfileDatabase.Models;
using Middleware.Mapper.ProfileDto;
using ServicesDatabase.Models;

namespace Middleware.Mapper
{
    public class MapperProfile : Profile
    {
        public MapperProfile()
        {
            CreateMap<Doctor, DoctorDto>().ReverseMap();
            CreateMap<Patient, PatientDto>().ReverseMap();
        }
    }
}