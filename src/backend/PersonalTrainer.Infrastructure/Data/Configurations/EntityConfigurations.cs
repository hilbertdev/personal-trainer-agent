using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalTrainer.Domain.Entities;

namespace PersonalTrainer.Infrastructure.Data.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("organizations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Email).HasMaxLength(320).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public class OrganizationMemberConfiguration : IEntityTypeConfiguration<OrganizationMember>
{
    public void Configure(EntityTypeBuilder<OrganizationMember> builder)
    {
        builder.ToTable("organization_members");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Role).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => new { x.OrganizationId, x.UserId }).IsUnique();
        builder.HasOne(x => x.Organization).WithMany(x => x.Members).HasForeignKey(x => x.OrganizationId);
        builder.HasOne(x => x.User).WithMany(x => x.Memberships).HasForeignKey(x => x.UserId);
    }
}

public class OtpChallengeConfiguration : IEntityTypeConfiguration<OtpChallenge>
{
    public void Configure(EntityTypeBuilder<OtpChallenge> builder)
    {
        builder.ToTable("otp_challenges");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Email).HasMaxLength(320).IsRequired();
        builder.Property(x => x.CodeHash).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Email);
    }
}
