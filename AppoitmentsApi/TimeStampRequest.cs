namespace AppoitmentsApi
{
    public class TimeStampRequest
    {
        public int DoctorId { get; set; }
        public DateOnly Date { get; set; }
        public int SlotSize { get; set; }
    }

}
