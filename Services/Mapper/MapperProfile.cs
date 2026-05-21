using AutoMapper;
using Middleware.Mapper.ServicesDto;
using ProfileDatabase.Models;
using Middleware.Mapper.ProfileDto;
using ServicesDatabase.Models;
using DocumentsDatabase.Models;

namespace Middleware.Mapper
{
    public class MapperProfile : Profile
    {
        public MapperProfile()
        {
            CreateMap<Doctor, DoctorDto>().ReverseMap();
            CreateMap<Patient, PatientDto>().ReverseMap();
            CreateMap<Photo, PhotoDto>().ReverseMap();
        }
    }
}