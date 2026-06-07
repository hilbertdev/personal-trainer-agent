using System.Net;
using System.Text;

namespace Training.Strava.Tests;

internal sealed class MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
{
    public List<HttpRequestMessage> Requests { get; } = [];

    public List<string> RequestBodies { get; } = [];

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        Requests.Add(request);

        if (request.Content is not null)
        {
            RequestBodies.Add(await request.Content.ReadAsStringAsync(cancellationToken));
        }

        return handler(request);
    }
}

internal static class MockHttp
{
    public static HttpClient CreateClient(Func<HttpRequestMessage, HttpResponseMessage> handler, string baseAddress = "https://www.strava.com/api/v3/")
    {
        return new HttpClient(new MockHttpMessageHandler(handler))
        {
            BaseAddress = new Uri(baseAddress)
        };
    }

    public static HttpResponseMessage JsonResponse(string json, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
    }
}
