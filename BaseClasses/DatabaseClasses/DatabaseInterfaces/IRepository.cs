using BaseModules.DatabaseClasses.DatabaseInterfaces;

namespace ProfileDatabase.Interfaces
{
    public interface IRepository<T> where T : class, IDataModel
    {
        public T GetById(int id);
        public IEnumerable<T> GetAll();
        public T Add(T model);
        public T Delete(int id);
        public T Update(T model);
        public int Count();
    }
}