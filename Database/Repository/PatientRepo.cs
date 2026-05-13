using ProfileDatabase.Core;
using ProfileDatabase.Models;
using BaseModules.DatabaseClasses;


namespace ProfileDatabase.Repository
{
    public class PatientRepo : Repository<Patient>
    {
        public PatientRepo(ProfileDbConnection databaseCore) : base(databaseCore) { }
        public List<Patient> GetAllByName(string name)
        {
            return _dbSet.Where(x => x.FirstName == name && x.IsLinkedToAccount == false).ToList();
        }
        public List<Patient> GetAllBySecondName(string secondName)
        {
            return _dbSet.Where(x => x.LastName == secondName && x.IsLinkedToAccount == false).ToList();
        }
        public Patient GetByAccountId(string id)
        {
            return _dbSet.FirstOrDefault(x => x.AccountId == id);
        }
    }
}