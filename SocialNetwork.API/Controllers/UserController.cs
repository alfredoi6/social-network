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
public class UserController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public UserController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserSearchDto>>> SearchUsers([FromQuery] string searchTerm)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var users = await _userManager.Users
            .Where(u => u.Id != currentUser.Id && 
                (u.UserName.Contains(searchTerm) || u.Email.Contains(searchTerm)))
            .Take(20)
            .Select(u => new UserSearchDto
            {
                Id = u.Id,
                Username = u.UserName,
                Email = u.Email,
                ProfilePicture = u.ProfilePicture,
                IsConnected = _context.Connections.Any(c => 
                    (c.RequesterId == currentUser.Id && c.ReceiverId == u.Id ||
                     c.RequesterId == u.Id && c.ReceiverId == currentUser.Id) &&
                    c.Status == ConnectionStatus.Accepted),
                ConnectionStatus = _context.Connections
                    .Where(c => 
                        (c.RequesterId == currentUser.Id && c.ReceiverId == u.Id) ||
                        (c.RequesterId == u.Id && c.ReceiverId == currentUser.Id))
                    .Select(c => c.Status.ToString())
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("connect")]
    public async Task<IActionResult> SendConnectionRequest([FromBody] ConnectionRequestDto request)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var receiver = await _userManager.FindByIdAsync(request.ReceiverId);
        if (receiver == null)
            return NotFound("User not found");

        // Check if connection already exists
        var existingConnection = await _context.Connections
            .FirstOrDefaultAsync(c =>
                (c.RequesterId == currentUser.Id && c.ReceiverId == receiver.Id) ||
                (c.RequesterId == receiver.Id && c.ReceiverId == currentUser.Id));

        if (existingConnection != null)
            return BadRequest("Connection already exists");

        var connection = new UserConnection
        {
            RequesterId = currentUser.Id,
            ReceiverId = receiver.Id,
            Status = ConnectionStatus.Pending
        };

        _context.Connections.Add(connection);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Connection request sent" });
    }

    [HttpPut("connect/{connectionId}/accept")]
    public async Task<IActionResult> AcceptConnection(string connectionId)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var connection = await _context.Connections
            .FirstOrDefaultAsync(c => c.Id == connectionId && c.ReceiverId == currentUser.Id);

        if (connection == null)
            return NotFound("Connection request not found");

        if (connection.Status != ConnectionStatus.Pending)
            return BadRequest("Connection is not in pending state");

        connection.Status = ConnectionStatus.Accepted;
        connection.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Connection accepted" });
    }

    [HttpPut("connect/{connectionId}/reject")]
    public async Task<IActionResult> RejectConnection(string connectionId)
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var connection = await _context.Connections
            .FirstOrDefaultAsync(c => c.Id == connectionId && c.ReceiverId == currentUser.Id);

        if (connection == null)
            return NotFound("Connection request not found");

        if (connection.Status != ConnectionStatus.Pending)
            return BadRequest("Connection is not in pending state");

        connection.Status = ConnectionStatus.Rejected;
        connection.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Connection rejected" });
    }

    [HttpGet("connections")]
    public async Task<ActionResult<IEnumerable<UserSearchDto>>> GetConnections()
    {
        var currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
            return Unauthorized();

        var connections = await _context.Connections
            .Where(c => (c.RequesterId == currentUser.Id || c.ReceiverId == currentUser.Id) &&
                       c.Status == ConnectionStatus.Accepted)
            .Select(c => new UserSearchDto
            {
                Id = c.RequesterId == currentUser.Id ? c.ReceiverId : c.RequesterId,
                Username = c.RequesterId == currentUser.Id ? 
                    c.Receiver.UserName : c.Requester.UserName,
                Email = c.RequesterId == currentUser.Id ? 
                    c.Receiver.Email : c.Requester.Email,
                ProfilePicture = c.RequesterId == currentUser.Id ? 
                    c.Receiver.ProfilePicture : c.Requester.ProfilePicture,
                IsConnected = true,
                ConnectionStatus = ConnectionStatus.Accepted.ToString()
            })
            .ToListAsync();

        return Ok(connections);
    }
}
