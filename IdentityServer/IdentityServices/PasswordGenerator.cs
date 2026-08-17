using System.Security.Cryptography;
using System.Text;

namespace IdentityServer.IdentityServices
{
    public static class PasswordGenerator
    {
        private const string UppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string LowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        private const string NumericChars = "0123456789";
        private const string SpecialChars = "!@#$%^&*()_+~|}{[]:;?><,./-=";

        public static string GenerateSecurePassword(int length = 12)
        {
            if (length < 4) throw new ArgumentException("Password length must be at least 4.", nameof(length));

            string allChars = UppercaseChars + LowercaseChars + NumericChars + SpecialChars;
            var password = new StringBuilder();

            password.Append(UppercaseChars[RandomNumberGenerator.GetInt32(UppercaseChars.Length)]);
            password.Append(LowercaseChars[RandomNumberGenerator.GetInt32(LowercaseChars.Length)]);
            password.Append(NumericChars[RandomNumberGenerator.GetInt32(NumericChars.Length)]);
            password.Append(SpecialChars[RandomNumberGenerator.GetInt32(SpecialChars.Length)]);

            int remainingLength = length - 4;
            for (int i = 0; i < remainingLength; i++)
            {
                password.Append(allChars[RandomNumberGenerator.GetInt32(allChars.Length)]);
            }

            char[] passwordArray = password.ToString().ToCharArray();
            for (int i = 0; i < passwordArray.Length; i++)
            {
                int swapIndex = RandomNumberGenerator.GetInt32(passwordArray.Length);
                char temp = passwordArray[i];
                passwordArray[i] = passwordArray[swapIndex];
                passwordArray[swapIndex] = temp;
            }

            return new string(passwordArray);
        }
    }
}
