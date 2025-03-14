namespace SocialNetwork.API.Models;

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string SenderId { get; set; } = string.Empty;
    public ApplicationUser? Sender { get; set; }
    public string ReceiverId { get; set; } = string.Empty;
    public ApplicationUser? Receiver { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
}
