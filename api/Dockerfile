# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Restore from project files first so application-only changes reuse the package layer.
COPY api/MersTassel.slnx api/global.json ./api/
COPY api/src/MersTassel.Api/MersTassel.Api.csproj ./api/src/MersTassel.Api/
COPY api/src/MersTassel.Application/MersTassel.Application.csproj ./api/src/MersTassel.Application/
COPY api/src/MersTassel.Domain/MersTassel.Domain.csproj ./api/src/MersTassel.Domain/
COPY api/src/MersTassel.Infrastructure/MersTassel.Infrastructure.csproj ./api/src/MersTassel.Infrastructure/
COPY api/src/MersTassel.PostgresMigrations/MersTassel.PostgresMigrations.csproj ./api/src/MersTassel.PostgresMigrations/
RUN dotnet restore api/src/MersTassel.Api/MersTassel.Api.csproj

COPY api/ ./api/
RUN dotnet publish api/src/MersTassel.Api/MersTassel.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /out \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /out/ ./
COPY api/seed-assets/ /seed-assets/

RUN apt-get update \
    && apt-get install --yes --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/wwwroot/uploads /app/keys /model-data /support-data \
    && chown -R "$APP_UID:$APP_UID" /app /seed-assets /model-data /support-data

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_EnableDiagnostics=0 \
    COMPlus_EnableDiagnostics=0
EXPOSE 8080
USER $APP_UID

HEALTHCHECK --interval=20s --timeout=5s --start-period=45s --retries=5 \
    CMD ["dotnet", "MersTassel.Api.dll", "--healthcheck"]

ENTRYPOINT ["dotnet", "MersTassel.Api.dll"]
