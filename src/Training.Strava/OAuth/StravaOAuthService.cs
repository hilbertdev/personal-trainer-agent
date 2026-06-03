namespace Training.Strava.OAuth;

public sealed class StravaOAuthService
{
    private const string AuthorizationEndpoint = "https://www.strava.com/oauth/authorize";

    public Uri BuildAuthorizationUri(
        string clientId,
        Uri redirectUri,
        string state,
        IEnumerable<string> scopes)
    {
        var query = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["redirect_uri"] = redirectUri.ToString(),
            ["response_type"] = "code",
            ["approval_prompt"] = "auto",
            ["scope"] = string.Join(',', scopes),
            ["state"] = state
        };

        var queryString = string.Join(
            '&',
            query.Select(item => $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value)}"));

        return new Uri($"{AuthorizationEndpoint}?{queryString}");
    }
}
