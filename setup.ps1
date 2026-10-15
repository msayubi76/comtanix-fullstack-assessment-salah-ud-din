# Builds and starts the whole project in Docker:
# MySQL, MongoDB, Laravel API (composer install, migrate, seed), queue worker,
# audit service (npm ci) and the dashboard (npm ci, build).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Docker is not installed. Install Docker Desktop first: https://docs.docker.com/get-docker/'
    exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker is installed but not running. Start Docker Desktop and run this script again.'
    exit 1
}

if (-not (Test-Path .env)) {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    @(
        "AUDIT_SECRET=$secret"
        'API_PORT=8000'
        'FRONTEND_PORT=5173'
        'AUDIT_PORT=4000'
        'MYSQL_PORT=3307'
        'MONGO_PORT=27017'
    ) | Set-Content -Path .env -Encoding ascii
    Write-Host 'Created .env with a new shared secret.'
}

$config = @{}
Get-Content .env | Where-Object { $_ -match '^\s*([A-Z_]+)=(.*)$' } | ForEach-Object {
    $config[$Matches[1]] = $Matches[2]
}
foreach ($key in 'API_PORT', 'FRONTEND_PORT', 'AUDIT_PORT') {
    $value = [Environment]::GetEnvironmentVariable($key)
    if ($value) { $config[$key] = $value }
}

Write-Host 'Building and starting containers (the first run takes a few minutes)...'
docker compose --profile app up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Waiting for the API and the dashboard...'
for ($i = 0; $i -lt 120; $i++) {
    try {
        Invoke-WebRequest "http://localhost:$($config.API_PORT)/up" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Invoke-WebRequest "http://localhost:$($config.FRONTEND_PORT)" -UseBasicParsing -TimeoutSec 5 | Out-Null

        Write-Host ''
        Write-Host 'Ready.'
        Write-Host "  Dashboard:     http://localhost:$($config.FRONTEND_PORT)"
        Write-Host "  Public form:   http://localhost:$($config.FRONTEND_PORT)/request-quote"
        Write-Host "  API:           http://localhost:$($config.API_PORT)/api"
        Write-Host "  Audit service: http://localhost:$($config.AUDIT_PORT)"
        Write-Host ''
        Write-Host '  Logins (password: password): admin@comtanix.test, staff1@comtanix.test, staff2@comtanix.test'
        Write-Host ''
        Write-Host '  Stop with:  docker compose --profile app down'
        exit 0
    } catch {
        Start-Sleep -Seconds 5
    }
}

Write-Host 'The services did not become ready in time. Check the logs with: docker compose --profile app logs api'
exit 1
