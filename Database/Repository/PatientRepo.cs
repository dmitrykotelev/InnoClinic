using Azure.Core;
using BaseModules.DatabaseClasses;
using Microsoft.EntityFrameworkCore;
using ProfileDatabase.Core;
using ProfileDatabase.Models;


namespace ProfileDatabase.Repository
{
    public class PatientRepo : Repository<Patient>
    {
        public PatientRepo(ProfileDbConnection databaseCore) : base(databaseCore) { }
        public async Task<Patient?> MatchPatient(Patient patient)
        {
            var matchedPatient = await _dbSet
            .Where(p => p.FirstName == patient.FirstName || p.LastName == patient.LastName)
            .Where(p => !p.IsLinkedToAccount)
            .Select(p => new
            {
                Profile = p,
                Score = (p.FirstName == patient.FirstName ? 5 : 0) +
                        (p.LastName == patient.LastName ? 5 : 0) +
                        (p.MiddleName == patient.MiddleName ? 5 : 0) +
                        (p.DateOfBirth.Date == patient.DateOfBirth.Date ? 3 : 0)
            })
            .Where(x => x.Score >= 13)
            .OrderByDescending(x => x.Score)
            .Select(x => x.Profile)
            .FirstOrDefaultAsync();

            return matchedPatient;
        }
        public Patient GetByAccountId(string id)
        {
            return _dbSet.FirstOrDefault(x => x.AccountId == id);
        }
        public List<Patient> GetAll(IQueryable<Patient> query)
        {
            var response = query.ToList();

            return response;
        }
    }
}