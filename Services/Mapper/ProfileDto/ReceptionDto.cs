namespace Middleware.Mapper.ProfileDto
{
    public class ReceptionDto : IDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? MiddleName { get; set; }
        public string AccountId { get; set; }
        public string OfficeId { get; set; }

    }
}