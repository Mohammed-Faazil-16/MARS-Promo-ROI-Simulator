param([switch]$SkipInstallers)
$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$Backend=Join-Path $ProjectRoot 'backend'; $Frontend=Join-Path $ProjectRoot 'promo-roi-frontend'
. (Join-Path $PSScriptRoot 'python-discovery.ps1')
function Refresh-Path {
    $machine=[Environment]::GetEnvironmentVariable('Path','Machine'); $user=[Environment]::GetEnvironmentVariable('Path','User')
    $env:Path=(@($machine,$user,$env:Path) -join ';')
}
function Check-Python($Exe) {
    if(-not $Exe -or -not (Test-Path -LiteralPath $Exe -PathType Leaf)){return $false}
    try { & $Exe -c "import sys; assert (3,11) <= sys.version_info[:2] < (3,15)" 2>$null; return ($LASTEXITCODE -eq 0) }
    catch { return $false }
}
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
$selectedPython=Get-CompatiblePython
$python=if($selectedPython){$selectedPython.Path}else{$null}
if(-not (Check-Python $python)) {
    if($SkipInstallers){throw 'Compatible Python 3.11–3.14 is required. Install from https://www.python.org/downloads/windows/ and rerun setup.'}
    if(-not (Install-WithWinget 'Python.Python.3.14')){ throw 'Python 3.11–3.14 is missing and winget is unavailable. Download the official Windows installer from https://www.python.org/downloads/windows/, enable the Python launcher or Add to PATH, then rerun .\setup.ps1.' }
    $selectedPython=Get-CompatiblePython
    $python=if($selectedPython){$selectedPython.Path}else{$null}
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
$venvPath=Join-Path $Backend '.venv'; $venvPython=Join-Path $venvPath 'Scripts\python.exe'
$selectedPythonVersion="$($selectedPython.Version.Major).$($selectedPython.Version.Minor)"
$recreateVenv=$false
if(Test-Path $venvPython) {
    $existingVenvVersion=(& $venvPython -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null).Trim()
    $recreateVenv=($LASTEXITCODE -ne 0 -or $existingVenvVersion -ne $selectedPythonVersion)
    if(-not $recreateVenv) {
        $existingVenvBase=(& $venvPython -c "import sys; print(getattr(sys, '_base_executable', sys.executable))" 2>$null).Trim()
        $recreateVenv=($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $existingVenvBase -PathType Leaf))
        if(-not $recreateVenv) {
            $selectedPythonPath=(Resolve-Path -LiteralPath $python).Path
            $existingVenvBasePath=(Resolve-Path -LiteralPath $existingVenvBase).Path
            $recreateVenv=-not [string]::Equals($selectedPythonPath,$existingVenvBasePath,[StringComparison]::OrdinalIgnoreCase)
        }
    }
}
if($recreateVenv) {
    $backupPath="$venvPath-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Warning "Existing virtual environment does not match selected Python. Preserving it at $backupPath."
    Move-Item -LiteralPath $venvPath -Destination $backupPath
}
if(-not (Test-Path $venvPython)) { Write-Host 'Creating backend virtual environment...'; & $python -m venv $venvPath; if($LASTEXITCODE -ne 0){throw 'Failed to create backend/.venv.'} }
& $venvPython -c "import sys; assert (3,11) <= sys.version_info[:2] < (3,15)"
if($LASTEXITCODE -ne 0){throw 'backend/.venv must use Python 3.11–3.14; rerun setup after checking the selected interpreter.'}
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
