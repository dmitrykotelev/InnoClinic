using IdentityServer.Settings;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Threading.Tasks;

namespace IdentityServer.Helpers
{
    public static class EmailHelper
    {
        public static async Task SendGmailAsync(EmailSettings settings, string targetEmail, string message)
        {
            var email = new MimeMessage();

            email.From.Add(new MailboxAddress("service", settings.SenderEmail));
            email.To.Add(new MailboxAddress("", targetEmail));
            email.Subject = "Confirmation";
            email.Body = new TextPart("html") { Text = message };

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(settings.SmtpServer, settings.Port, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(settings.SenderEmail, settings.Password);

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}