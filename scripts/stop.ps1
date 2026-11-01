$ErrorActionPreference='Continue'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$trackingPath=Join-Path (Join-Path $env:LOCALAPPDATA 'MARS-Promo-ROI') 'processes.json'
if(-not (Test-Path $trackingPath)){Write-Host 'No tracked MARS Promo ROI windows found. Close the backend and frontend terminal windows if they are open.'; exit 0}
try{$entries=@(Get-Content -Raw $trackingPath | ConvertFrom-Json)}catch{Write-Warning 'Could not read the project process record. Close the two project terminal windows manually.'; exit 1}
$match=@($entries | Where-Object {$_.ProjectRoot -eq $ProjectRoot})
if(-not $match.Count){Write-Host 'No tracked processes for this extracted project. Close its backend and frontend terminal windows if they are open.'; exit 0}
foreach($entry in $match){
    foreach($pidValue in @($entry.BackendPid,$entry.FrontendPid)){
        if($pidValue){
            $proc=Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
            if($proc){Write-Host "Stopping tracked project window and its child processes (PID $pidValue)..."; & taskkill.exe /PID ([int]$pidValue) /T /F 2>$null | Out-Null}
        }
    }
}
$entries=@($entries | Where-Object {$_.ProjectRoot -ne $ProjectRoot})
if($entries.Count){$entries | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $trackingPath -Encoding UTF8}else{Remove-Item -LiteralPath $trackingPath -Force -ErrorAction SilentlyContinue}
Write-Host 'Tracked backend and frontend processes have been stopped.' -ForegroundColor Green
