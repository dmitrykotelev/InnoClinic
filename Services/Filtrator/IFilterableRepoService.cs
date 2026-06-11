using Middleware.Mapper;

namespace Middleware.AppoitnmentFiltrator
{
    public interface IFilterableRepoService<T> where T : IDto
    {
        public List<T> GetAll(string name);
    }
}
