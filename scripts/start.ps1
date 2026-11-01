$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$Backend=Join-Path $ProjectRoot 'backend'; $Frontend=Join-Path $ProjectRoot 'promo-roi-frontend'
$BackendPort=8001; $FrontendPort=5173
if($env:MARS_BACKEND_PORT){
    $configuredPort=0
    if(-not [int]::TryParse($env:MARS_BACKEND_PORT,[ref]$configuredPort) -or $configuredPort -lt 1 -or $configuredPort -gt 65535){throw 'MARS_BACKEND_PORT must be an integer from 1 through 65535.'}
    $BackendPort=$configuredPort
}
if($env:MARS_FRONTEND_PORT){
    $configuredPort=0
    if(-not [int]::TryParse($env:MARS_FRONTEND_PORT,[ref]$configuredPort) -or $configuredPort -lt 1 -or $configuredPort -gt 65535){throw 'MARS_FRONTEND_PORT must be an integer from 1 through 65535.'}
    $FrontendPort=$configuredPort
}
function Test-PortAvailable([int]$Port) {
    $listener=$null
    try { $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port); $listener.Start(); return $true }
    catch { return $false }
    finally { if($listener){$listener.Stop()} }
}
function Test-PortListening([int]$Port) {
    $client=$null
    try {
        $client=[System.Net.Sockets.TcpClient]::new()
        $connect=$client.ConnectAsync([System.Net.IPAddress]::Loopback,$Port)
        return ($connect.Wait(500) -and $client.Connected)
    } catch { return $false }
    finally { if($client){$client.Dispose()} }
}
function Quote-PowerShell([string]$Value){ return "'"+$Value.Replace("'","''")+"'" }
function Encode-Command([string]$Text){ return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Text)) }
function Start-ProjectWindow([string]$Title,[string]$Command) {
    $pwsh=Get-Command pwsh -ErrorAction SilentlyContinue
    if($pwsh){$shell=$pwsh.Source}else{$shell=(Get-Command powershell.exe -ErrorAction Stop).Source}
    $full="$Command`nWrite-Host ''; Write-Host 'This project terminal can be closed when you are done.'; Read-Host 'Press Enter to close this window'"
    $encoded=Encode-Command $full
    return Start-Process -FilePath $shell -ArgumentList @('-NoExit','-ExecutionPolicy','Bypass','-EncodedCommand',$encoded) -PassThru
}
if(-not (Test-Path (Join-Path $Backend '.venv\Scripts\python.exe')) -or -not (Test-Path (Join-Path $Frontend 'node_modules')) -or -not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host 'Setup is incomplete; running setup.ps1 first...' -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot 'setup.ps1')
    if($LASTEXITCODE -and $LASTEXITCODE -ne 0){throw 'Setup failed; see the message above.'}
}
$python=Join-Path $Backend '.venv\Scripts\python.exe'
if(-not (Test-Path $python)){throw "Backend Python is missing at $python. Run .\setup.ps1 first."}
if(-not (Test-Path (Join-Path $Frontend 'node_modules'))){throw 'Frontend dependencies are missing. Run .\setup.ps1 first.'}
foreach($port in @($BackendPort,$FrontendPort)) {
    if(-not (Test-PortAvailable $port)) {
        if($port -eq $FrontendPort){throw "Frontend port $port is occupied or reserved. No process was stopped. Choose an available port with MARS_FRONTEND_PORT (for example 5174), then rerun start.ps1."}
        throw "Backend port $port is occupied or reserved. No process was stopped. Choose an available port with MARS_BACKEND_PORT, then rerun start.ps1."
    }
}
$projectQ=Quote-PowerShell $ProjectRoot; $backendQ=Quote-PowerShell $Backend; $frontendQ=Quote-PowerShell $Frontend; $pythonQ=Quote-PowerShell $python
$backendCommand="Set-Location -LiteralPath $backendQ; `$env:CORS_ORIGINS='http://localhost:$FrontendPort,http://127.0.0.1:$FrontendPort'; Write-Host 'MARS Promo ROI API: http://127.0.0.1:$BackendPort' -ForegroundColor Cyan; Write-Host 'Swagger: http://127.0.0.1:$BackendPort/docs' -ForegroundColor Cyan; & $pythonQ -m uvicorn app.main:app --reload --host 127.0.0.1 --port $BackendPort"
$frontendCommand="Set-Location -LiteralPath $frontendQ; `$env:VITE_API_BASE_URL='http://127.0.0.1:$BackendPort/api'; Write-Host 'MARS Promo ROI frontend: http://127.0.0.1:$FrontendPort' -ForegroundColor Cyan; Write-Host 'Backend API: http://127.0.0.1:$BackendPort/api' -ForegroundColor Cyan; & npm.cmd run dev -- --host 127.0.0.1 --port $FrontendPort --strictPort"
$backendWindow=Start-ProjectWindow 'MARS Promo ROI Backend' $backendCommand
Start-Sleep -Milliseconds 900
try { $frontendWindow=Start-ProjectWindow 'MARS Promo ROI Frontend' $frontendCommand }
catch { try { & taskkill.exe /PID $backendWindow.Id /T /F 2>$null | Out-Null } catch {}; throw }
$deadline=(Get-Date).AddSeconds(25)
do {
    $backendReady=Test-PortListening $BackendPort
    $frontendReady=Test-PortListening $FrontendPort
    if($backendReady -and $frontendReady){break}
    Start-Sleep -Milliseconds 500
} while((Get-Date) -lt $deadline)
if(-not $backendReady -or -not $frontendReady){
    foreach($window in @($backendWindow,$frontendWindow)){if($window){try{& taskkill.exe /PID $window.Id /T /F 2>$null | Out-Null}catch{}}}
    throw "Startup did not open both required ports within 25 seconds (backend $BackendPort ready: $backendReady; frontend $FrontendPort ready: $frontendReady). Check the application windows for the startup error."
}
$trackingDirectory=Join-Path $env:LOCALAPPDATA 'MARS-Promo-ROI'
New-Item -ItemType Directory -Path $trackingDirectory -Force | Out-Null
$trackingPath=Join-Path $trackingDirectory 'processes.json'
$entries=@()
if(Test-Path $trackingPath){try{$entries=@(Get-Content -Raw $trackingPath | ConvertFrom-Json)}catch{$entries=@()}}
$entries=@($entries | Where-Object { $_.ProjectRoot -ne $ProjectRoot })
$entries+=@([pscustomobject]@{ProjectRoot=$ProjectRoot; StartedAt=(Get-Date).ToString('o'); BackendPid=$backendWindow.Id; BackendStartedAtTicks=$backendWindow.StartTime.ToUniversalTime().Ticks; FrontendPid=$frontendWindow.Id; FrontendStartedAtTicks=$frontendWindow.StartTime.ToUniversalTime().Ticks})
$entries | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $trackingPath -Encoding UTF8
Write-Host "Backend:  http://127.0.0.1:$BackendPort"
Write-Host "Frontend: http://127.0.0.1:$FrontendPort"
Write-Host "Swagger:  http://127.0.0.1:$BackendPort/docs"
Write-Host "Frontend API base URL: http://127.0.0.1:$BackendPort/api"
Write-Host 'Opened separate PowerShell windows. Use .\scripts\stop.ps1 to stop these project processes.' -ForegroundColor Green
