using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocialNetwork.API.Models;

namespace SocialNetwork.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Message> Messages { get; set; }
    public DbSet<UserConnection> Connections { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure UserConnection relationships
        builder.Entity<UserConnection>()
            .HasOne(uc => uc.Requester)
            .WithMany(u => u.Connections)
            .HasForeignKey(uc => uc.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<UserConnection>()
            .HasOne(uc => uc.Receiver)
            .WithMany()
            .HasForeignKey(uc => uc.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Message relationships
        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Message>()
            .HasOne(m => m.Receiver)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
