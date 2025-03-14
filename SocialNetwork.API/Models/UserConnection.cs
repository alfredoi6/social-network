namespace SocialNetwork.API.Models;

public class UserConnection
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RequesterId { get; set; } = string.Empty;
    public ApplicationUser? Requester { get; set; }
    public string ReceiverId { get; set; } = string.Empty;
    public ApplicationUser? Receiver { get; set; }
    public ConnectionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum ConnectionStatus
{
    Pending,
    Accepted,
    Rejected
}
