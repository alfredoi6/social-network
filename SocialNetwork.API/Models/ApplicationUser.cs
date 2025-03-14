using Microsoft.AspNetCore.Identity;

namespace SocialNetwork.API.Models;

public class ApplicationUser : IdentityUser
{
    public string? ProfilePicture { get; set; }
    public List<UserConnection> Connections { get; set; } = new();
    public List<Message> SentMessages { get; set; } = new();
    public List<Message> ReceivedMessages { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
