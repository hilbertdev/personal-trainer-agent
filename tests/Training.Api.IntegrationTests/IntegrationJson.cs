using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Training.Api.IntegrationTests;

internal static class IntegrationJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };
}

internal static class HttpClientJsonExtensions
{
    public static Task<T?> ReadIntegrationJsonAsync<T>(this HttpContent content)
    {
        return content.ReadFromJsonAsync<T>(IntegrationJson.Options)!;
    }
}
