namespace Middleware.Mapper
{
    public class PhotoDto : IDto
    {
        public Guid Id { get; set; }
        public string? PhotoUrl { get; set; }
        public DateTime LastUpdate {  get; set; }
        public PhotoDto(string url)
        {
            PhotoUrl = url;
            LastUpdate = DateTime.Now;
        } 
        public PhotoDto() { }
    }
}
