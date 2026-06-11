namespace AppoitmentsApi
{
    public class WorkDayConstants
    {
        public static readonly TimeOnly workDayStart = new TimeOnly(9, 0);
        public static readonly TimeOnly workDayEnd = new TimeOnly(18, 0);
        public const int slotDuration = 10;
    }
}
