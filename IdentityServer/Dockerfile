# ЭТАП 1: Сборка
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /project

# Копируем csproj ВСЕХ связанных проектов, чтобы восстановить зависимости
COPY ["IdentityServer/IdentityServer.csproj", "IdentityServer/"]
COPY ["IdentityServerDatabase/IdentityServerDatabase.csproj", "IdentityServerDatabase/"]
COPY ["BaseApi/BaseApi.csproj", "BaseApi/"]
COPY ["BaseClasses/BaseModules.csproj", "BaseClasses/"]

# Восстанавливаем пакеты главного проекта (остальные подтянутся по цепочке)
RUN dotnet restore "IdentityServer/IdentityServer.csproj"

# Копируем вообще весь код решения
COPY . .

# Переходим в папку главного проекта и публикуем его
WORKDIR "/project/IdentityServer"
RUN dotnet publish "IdentityServer.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ЭТАП 2: Выполнение
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "IdentityServer.dll"]