using AutoMapper;
using Middleware.Mapper.OfficesDto;
using OfficesDatabse;
using OfficesDatabse.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Middleware.Repository.OfficeRepositoryService
{
    public class OfficeRepositoryService : RepositoryService<Office, OfficeDto>
    {
        OfficeRepository _officeRepository;
        public OfficeRepositoryService(OfficeRepository officeRepository, IMapper mapper) : base(officeRepository, mapper)
        {
            _officeRepository = officeRepository;
        }
        public OfficeDto GetById(string id)
        {
            var data = _officeRepository.GetById(id);
            OfficeDto dto = _mapper.Map<OfficeDto>(data);

            return _mapper.Map<OfficeDto>(_officeRepository.GetById(id));
        }

        public bool Delete(string id)
        {
            var data = _officeRepository.Delete(id);

            if (data == null)
                return false;
            else
                return true;
        }
    }
}
