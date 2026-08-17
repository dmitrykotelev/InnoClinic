using BaseModules.DatabaseClasses.DatabaseInterfaces;
using Microsoft.EntityFrameworkCore;
using ProfileDatabase.Interfaces;
using System.Numerics;

namespace BaseModules.DatabaseClasses
{
    abstract public class Repository<T> where T : class, IDataModel
    {
        protected readonly DbContext _context;
        protected readonly DbSet<T> _dbSet;

        protected Repository(DbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public virtual T Add(T model)
        {
            var response = _dbSet.Add(model);

            if (Save())
                return (T)response.Entity;

            return null;
        }

        public virtual T GetById(int id)
        {
            var response = _dbSet.Find(id);
            return response;
        }
        public virtual T GetByGuId(Guid id)
        {
            var response = _dbSet.Find(id);
            return response;
        }
        public virtual IEnumerable<T> GetAll()
        {
            var response = _dbSet.ToList();
            return response;
        }

        public virtual T Delete(int id)
        {
            T model = GetById(id);
            var response = _dbSet.Remove(model);

            if (Save())
                return (T)response.Entity;

            return null;
        }

        public virtual T Update(T model)
        {
            _context.ChangeTracker.Clear();
               
            var response = _dbSet.Update(model);

            if (Save())
                return (T)response.Entity;

            return null;
        }
        public IQueryable<T> GetBaseQuery()
        {
            return _dbSet.AsQueryable();
        }

        public virtual int Count()
        {
            return _dbSet.Count();
        }
        protected bool Save()
        {
            var status = _context.SaveChanges();
            if (status != 0)
                return true;

            return false;
        }
    }
}