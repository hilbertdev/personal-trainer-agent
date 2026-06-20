# Personal Trainer SaaS API

QBS-scaffolded .NET backend using **Traditional Services** architecture.

## Stack

- .NET 10, EF Core, PostgreSQL, Redis
- OTP authentication + JWT
- Multi-tenant organizations
- Scalar API docs (development)

## Local development

```bash
# From repo root
cp .env.example .env   # set DB_PASSWORD, JWT_KEY, RESEND_API_KEY
docker compose -f docker-compose.saas.yml up

# Or run API directly (requires Postgres + Redis)
cd src/backend
dotnet run --project PersonalTrainer.Api
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/request-otp` | Request OTP email |
| `POST /api/auth/verify-otp` | Verify OTP and receive JWT |
| `GET /api/organizations` | List organizations (auth required) |
| `GET /health` | Health check |

API docs: http://localhost:5075/scalar (Development)

## Migrations

```bash
cd src/backend
dotnet ef migrations add <Name> \
  --project PersonalTrainer.Infrastructure/PersonalTrainer.Infrastructure.csproj \
  --startup-project PersonalTrainer.Api/PersonalTrainer.Api.csproj

dotnet ef database update \
  --project PersonalTrainer.Infrastructure/PersonalTrainer.Infrastructure.csproj \
  --startup-project PersonalTrainer.Api/PersonalTrainer.Api.csproj
```

## Tests

```bash
cd src/backend
dotnet test
```
