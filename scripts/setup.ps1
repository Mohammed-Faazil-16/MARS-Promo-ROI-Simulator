param([switch]$SkipInstallers)
$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$Backend=Join-Path $ProjectRoot 'backend'; $Frontend=Join-Path $ProjectRoot 'promo-roi-frontend'
function Refresh-Path {
    $machine=[Environment]::GetEnvironmentVariable('Path','Machine'); $user=[Environment]::GetEnvironmentVariable('Path','User')
    $env:Path=(@($machine,$user,$env:Path) -join ';')
}
function Find-Python {
    $py=Get-Command py -ErrorAction SilentlyContinue
    if($py){ $out=& $py.Source -3.12 -c "import sys; print(sys.executable)" 2>$null; if($LASTEXITCODE -eq 0){ return $out.Trim() } }
    $cmd=Get-Command python -ErrorAction SilentlyContinue
    if($cmd){ $out=& $cmd.Source -c "import sys; print(sys.executable); assert (3,11) <= sys.version_info[:2] < (3,14)" 2>$null; if($LASTEXITCODE -eq 0){ return ($out -split "`n")[0].Trim() } }
    return $null
}
function Check-Python($Exe) { if(-not $Exe){return $false}; & $Exe -c "import sys; assert (3,11) <= sys.version_info[:2] < (3,14)" 2>$null; return ($LASTEXITCODE -eq 0) }
function Check-Node {
    $node=Get-Command node -ErrorAction SilentlyContinue; $npm=Get-Command npm -ErrorAction SilentlyContinue
    if(-not $node -or -not $npm){return $false}
    $v=((& $node.Source --version) -replace '^v','').Trim(); try{$n=[version]$v}catch{return $false}
    return ((($n.Major -eq 20) -and $n -ge [version]'20.19') -or (($n.Major -ge 22) -and $n -ge [version]'22.12'))
}
function Install-WithWinget($Id) {
    $wg=Get-Command winget -ErrorAction SilentlyContinue
    if(-not $wg){return $false}
    Write-Host "Installing $Id using Windows Package Manager. Review and accept installer prompts if shown..."
    & $wg.Source install --id $Id --exact --accept-package-agreements --accept-source-agreements
    if($LASTEXITCODE -ne 0){throw "winget could not install $Id (exit $LASTEXITCODE). Install it from the official download page and rerun setup."}
    Refresh-Path
    return $true
}
Write-Host 'Checking portable project prerequisites...'
$python=Find-Python
if(-not (Check-Python $python)) {
    if($SkipInstallers){throw 'Compatible Python 3.11–3.13 is required. Install from https://www.python.org/downloads/windows/ and rerun setup.'}
    if(-not (Install-WithWinget 'Python.Python.3.12')){ throw 'Python 3.11–3.13 is missing and winget is unavailable. Download the official Windows installer from https://www.python.org/downloads/windows/, enable the Python launcher or Add to PATH, then rerun .\setup.ps1.' }
    $python=Find-Python
    if(-not (Check-Python $python)){throw 'Python installation was not detected after installer completion. Close and reopen PowerShell, then run .\setup.ps1 again.'}
}
Write-Host "Using Python: $python"
if(-not (Check-Node)) {
    if($SkipInstallers){throw 'Compatible Node.js and npm are required. Install Node.js LTS from https://nodejs.org/en/download and rerun setup.'}
    if(-not (Install-WithWinget 'OpenJS.NodeJS.LTS')){ throw 'Compatible Node.js is missing and winget is unavailable. Install the official Node.js LTS Windows installer from https://nodejs.org/en/download, reopen PowerShell, and rerun .\setup.ps1.' }
    if(-not (Check-Node)){throw 'Node/npm was not detected after installation. Close and reopen PowerShell, then run .\setup.ps1 again.'}
}
$nodeVersion=((& (Get-Command node).Source --version) -replace '^v','').Trim()
if(([version]$nodeVersion).Major -eq 22 -and [version]$nodeVersion -lt [version]'22.13'){
    Write-Warning 'Vite supports this Node version, but the locked ESLint packages declare Node 22.13+; dependency installation/build are supported, while lint may report an engine warning.'
}
$venvPython=Join-Path $Backend '.venv\Scripts\python.exe'
if(-not (Test-Path $venvPython)) { Write-Host 'Creating backend virtual environment...'; & $python -m venv (Join-Path $Backend '.venv'); if($LASTEXITCODE -ne 0){throw 'Failed to create backend/.venv.'} }
& $venvPython -c "import sys; assert (3,11) <= sys.version_info[:2] < (3,14)"
if($LASTEXITCODE -ne 0){throw 'Existing backend/.venv uses an incompatible Python version. Remove backend/.venv and rerun setup.'}
Write-Host 'Installing backend requirements into backend/.venv...'
& $venvPython -m pip install -r (Join-Path $Backend 'requirements.txt')
if($LASTEXITCODE -ne 0){throw 'Backend dependency installation failed. Check network access and backend/requirements.txt.'}
Write-Host 'Checking backend imports...'
Push-Location $Backend
try { & $venvPython -c "import fastapi, uvicorn, pydantic, sqlalchemy, httpx; print('Backend imports OK')"; if($LASTEXITCODE -ne 0){throw 'Backend import verification failed.'} }
finally { Pop-Location }
Write-Host 'Installing exact frontend dependencies...'
Push-Location $Frontend
try {
    if(Test-Path 'package-lock.json'){ & npm.cmd ci --no-audit --no-fund }
    else { Write-Warning 'No package-lock.json found; using npm install.'; & npm.cmd install }
    if($LASTEXITCODE -ne 0){throw 'Frontend dependency installation failed. Check network access and the package manifest.'}
    & npm.cmd ls --depth=0
    if($LASTEXITCODE -ne 0){throw 'Frontend package verification failed.'}
}
finally { Pop-Location }
Write-Host 'Setup complete. Run .\start.ps1 from the project root.' -ForegroundColor Green
