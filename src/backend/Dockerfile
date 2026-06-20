FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY *.sln ./
COPY PersonalTrainer.Api/PersonalTrainer.Api.csproj PersonalTrainer.Api/
COPY PersonalTrainer.Application/PersonalTrainer.Application.csproj PersonalTrainer.Application/
COPY PersonalTrainer.Infrastructure/PersonalTrainer.Infrastructure.csproj PersonalTrainer.Infrastructure/
COPY PersonalTrainer.Domain/PersonalTrainer.Domain.csproj PersonalTrainer.Domain/
RUN dotnet restore

COPY . .
RUN dotnet publish PersonalTrainer.Api/PersonalTrainer.Api.csproj \
    -c Release \
    --no-restore \
    -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5075
ENTRYPOINT ["dotnet", "PersonalTrainer.Api.dll"]
