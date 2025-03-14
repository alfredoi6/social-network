using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.API.Data;
using SocialNetwork.API.DTOs;
using SocialNetwork.API.Models;

namespace SocialNetwork.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MessageController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public MessageController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto messageDto)
    {
        var sender = await _userManager.GetUserAsync(User);
        if (sender == null)
            return Unauthorized();

        var receiver = await _userManager.FindByIdAsync(messageDto.ReceiverId);
        if (receiver == null)
            return NotFound("Recipient not found");

        // Verify users are connected before allowing message
        var areConnected = await _context.Connections
            .AnyAsync(c => c.Status == ConnectionStatus.Accepted &&
                ((c.RequesterId == sender.Id && c.ReceiverId == receiver.Id) ||
                 (c.RequesterId == receiver.Id && c.ReceiverId == sender.Id)));

        if (!areConnected)
            return BadRequest("You can only send messages to connected users");

        var message = new Message
        {
            SenderId = sender.Id,
            ReceiverId = receiver.Id,
            Content = messageDto.Content,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new MessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderUsername = sender.UserName,
            ReceiverId = message.ReceiverId,
            ReceiverUsername = receiver.UserName,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            IsRead = message.IsRead
        });
    }

    [HttpGet("conversation/{userId}")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetConversation(string userId)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var otherUser = await _userManager.FindByIdAsync(userId);
        if (otherUser == null)
            return NotFound("User not found");

        // Verify users are connected
        var areConnected = await _context.Connections
            .AnyAsync(c => c.Status == ConnectionStatus.Accepted &&
                ((c.RequesterId == currentUser.Id && c.ReceiverId == userId) ||
                 (c.RequesterId == userId && c.ReceiverId == currentUser.Id)));

        if (!areConnected)
            return BadRequest("You can only view messages with connected users");

        var messages = await _context.Messages
            .Where(m => (m.SenderId == currentUser.Id && m.ReceiverId == userId) ||
                       (m.SenderId == userId && m.ReceiverId == currentUser.Id))
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderUsername = m.Sender.UserName,
                ReceiverId = m.ReceiverId,
                ReceiverUsername = m.Receiver.UserName,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                IsRead = m.IsRead
            })
            .ToListAsync();

        // Mark unread messages as read
        var unreadMessages = await _context.Messages
            .Where(m => m.ReceiverId == currentUser.Id && 
                       m.SenderId == userId && 
                       !m.IsRead)
            .ToListAsync();

        if (unreadMessages.Any())
        {
            unreadMessages.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();
        }

        return Ok(messages);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadMessageCount()
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var unreadCount = await _context.Messages
            .CountAsync(m => m.ReceiverId == currentUser.Id && !m.IsRead);

        return Ok(unreadCount);
    }

    [HttpGet("recent-conversations")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetRecentConversations()
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var recentMessages = await _context.Messages
            .Where(m => m.SenderId == currentUser.Id || m.ReceiverId == currentUser.Id)
            .GroupBy(m => m.SenderId == currentUser.Id ? m.ReceiverId : m.SenderId)
            .Select(g => g.OrderByDescending(m => m.CreatedAt).First())
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderUsername = m.Sender.UserName,
                ReceiverId = m.ReceiverId,
                ReceiverUsername = m.Receiver.UserName,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                IsRead = m.IsRead
            })
            .OrderByDescending(m => m.CreatedAt)
            .Take(20)
            .ToListAsync();

        return Ok(recentMessages);
    }
}
