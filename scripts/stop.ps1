$ErrorActionPreference='Continue'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$trackingPath=Join-Path (Join-Path $env:LOCALAPPDATA 'MARS-Promo-ROI') 'processes.json'
if(-not (Test-Path $trackingPath)){Write-Host 'No tracked MARS Promo ROI windows found. Close the backend and frontend terminal windows if they are open.'; exit 0}
try{$entries=@(Get-Content -Raw $trackingPath | ConvertFrom-Json)}catch{Write-Warning 'Could not read the project process record. Close the two project terminal windows manually.'; exit 1}
$match=@($entries | Where-Object {$_.ProjectRoot -eq $ProjectRoot})
if(-not $match.Count){Write-Host 'No tracked processes for this extracted project. Close its backend and frontend terminal windows if they are open.'; exit 0}
foreach($entry in $match){
    foreach($tracked in @(
        [pscustomobject]@{Pid=$entry.BackendPid; StartedAtTicks=$entry.BackendStartedAtTicks},
        [pscustomobject]@{Pid=$entry.FrontendPid; StartedAtTicks=$entry.FrontendStartedAtTicks}
    )){
        if($tracked.Pid -and $tracked.StartedAtTicks){
            $proc=Get-Process -Id ([int]$tracked.Pid) -ErrorAction SilentlyContinue
            $expectedStart=0L
            $isTracked=$false
            if($proc -and $proc.ProcessName -in @('pwsh','powershell') -and [long]::TryParse([string]$tracked.StartedAtTicks,[ref]$expectedStart)){
                try { $isTracked=($proc.StartTime.ToUniversalTime().Ticks -eq $expectedStart) } catch { $isTracked=$false }
            }
            if($isTracked){Write-Host "Stopping tracked project window and its child processes (PID $($tracked.Pid))..."; & taskkill.exe /PID ([int]$tracked.Pid) /T /F 2>$null | Out-Null}
        }
    }
}
$entries=@($entries | Where-Object {$_.ProjectRoot -ne $ProjectRoot})
if($entries.Count){$entries | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $trackingPath -Encoding UTF8}else{Remove-Item -LiteralPath $trackingPath -Force -ErrorAction SilentlyContinue}
Write-Host 'Tracked backend and frontend processes have been stopped.' -ForegroundColor Green
