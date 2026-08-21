namespace MersTassel.Infrastructure.Email;

public class EmailOptions
{
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string AppPassword { get; set; } = string.Empty;
    public string Recipient { get; set; } = "merstassel@gmail.com";
    public string FromName { get; set; } = "MERS Tassel Website";
}
