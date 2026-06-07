using Training.Infrastructure.Persistence;

namespace Training.Infrastructure.Tests;

public sealed class SqliteTestFixture : IDisposable
{
    public SqliteTestFixture()
    {
        var databasePath = Path.Combine(Path.GetTempPath(), $"training-tests-{Guid.NewGuid():N}.db");
        ConnectionString = $"Data Source={databasePath}";
        ConnectionFactory = new SqliteConnectionFactory(ConnectionString);
    }

    public string ConnectionString { get; }

    public SqliteConnectionFactory ConnectionFactory { get; }

    public void Dispose()
    {
        var databasePath = ConnectionString.Replace("Data Source=", string.Empty, StringComparison.Ordinal);
        if (File.Exists(databasePath))
        {
            File.Delete(databasePath);
        }
    }
}
