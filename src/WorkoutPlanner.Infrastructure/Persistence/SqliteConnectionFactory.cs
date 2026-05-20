using Microsoft.Data.Sqlite;

namespace WorkoutPlanner.Infrastructure.Persistence;

public sealed class SqliteConnectionFactory(string connectionString)
{
    public SqliteConnection CreateConnection()
    {
        EnsureDatabaseDirectoryExists();
        return new SqliteConnection(connectionString);
    }

    private void EnsureDatabaseDirectoryExists()
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        var dataSource = builder.DataSource;

        if (string.IsNullOrWhiteSpace(dataSource)
            || dataSource is ":memory:"
            || dataSource.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var directory = Path.GetDirectoryName(Path.GetFullPath(dataSource));

        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }
}
