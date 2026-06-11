using AutoMapper;
using Middleware.Mapper.ServicesDto;
using ProfileDatabase.Models;
using Middleware.Mapper.ProfileDto;
using ServicesDatabase.Models;
using DocumentsDatabase.Models;
using Middleware.Mapper.OfficesDto;
using OfficesDatabse.Models;
using AppoitmentsDatabase.Models;
using Middleware.Mapper.AppoitmentsDto;

namespace Middleware.Mapper
{
    public class MapperProfile : Profile
    {
        public MapperProfile()
        {
            CreateMap<Doctor, DoctorDto>().ReverseMap();
            CreateMap<Patient, PatientDto>().ReverseMap();
            CreateMap<Photo, PhotoDto>().ReverseMap();
            CreateMap<Specialization, SpecializationDto>().ReverseMap();
            CreateMap<ServiceCategory, ServiceCategoryDto>().ReverseMap();
            CreateMap<Service, ServiceDto>().ReverseMap();
            CreateMap<Office, OfficeDto>().ReverseMap();
            CreateMap<Appoitment,AppointmentDto>().ReverseMap();
        }
    }
}