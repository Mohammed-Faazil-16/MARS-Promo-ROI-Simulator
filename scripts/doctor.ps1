param([switch]$Json)
$ErrorActionPreference = 'Continue'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $ProjectRoot 'promo-roi-frontend'
$Backend = Join-Path $ProjectRoot 'backend'
$results = [System.Collections.Generic.List[object]]::new()
function Add-Check($Name, $Status, $Detail) { $results.Add([pscustomobject]@{ Check=$Name; Status=$Status; Detail=$Detail }) }
function Test-PortFree([int]$Port) {
    $listener=$null
    try { $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port); $listener.Start(); return $true }
    catch { return $false }
    finally { if($listener){$listener.Stop()} }
}
try {
    $os = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -ErrorAction Stop
    Add-Check 'Windows' 'OK' ("Windows {0}, build {1}" -f $os.DisplayVersion,$os.CurrentBuild)
} catch { Add-Check 'Windows' 'WARN' ("Windows version {0}" -f [Environment]::OSVersion.Version) }
Add-Check 'PowerShell' 'OK' $PSVersionTable.PSVersion.ToString()
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
$pyCmd = Get-Command py -ErrorAction SilentlyContinue
$pythonPath = $null; $pythonVersion = $null
if ($pyCmd) {
    $pyOut = & $pyCmd.Source -3.12 -c "import sys; print(sys.executable); print('.'.join(map(str,sys.version_info[:3])))" 2>$null
    if ($LASTEXITCODE -eq 0 -and $pyOut.Count -ge 2) { $pythonPath=$pyOut[0]; $pythonVersion=$pyOut[1] }
}
if (-not $pythonPath -and $pythonCmd) {
    $pyOut = & $pythonCmd.Source -c "import sys; print(sys.executable); print('.'.join(map(str,sys.version_info[:3])))" 2>$null
    if ($LASTEXITCODE -eq 0 -and $pyOut.Count -ge 2) { $pythonPath=$pyOut[0]; $pythonVersion=$pyOut[1] }
}
if ($pythonVersion) {
    $v = [version]$pythonVersion
    $ok = $v -ge [version]'3.11' -and $v -lt [version]'3.14'
    Add-Check 'Python' $(if($ok){'OK'}else{'FAIL'}) ("Python {0} at {1}; supported 3.11–3.13" -f $pythonVersion,$pythonPath)
} else { Add-Check 'Python' 'FAIL' 'Python 3.11–3.13 was not found.' }
Add-Check 'Python launcher (py)' $(if($pyCmd){'OK'}else{'WARN'}) $(if($pyCmd){$pyCmd.Source}else{'Not found; python.exe may still be usable.'})
$nodeCmd=Get-Command node -ErrorAction SilentlyContinue; $npmCmd=Get-Command npm -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVersion=((& $nodeCmd.Source --version 2>$null) -replace '^v','').Trim()
    $nv=[version]$nodeVersion
    $nodeOk=($nv.Major -eq 20 -and $nv -ge [version]'20.19') -or ($nv.Major -ge 22 -and $nv -ge [version]'22.12')
    $detail="Node {0}; Vite requires 20.19+ or 22.12+" -f $nodeVersion
    if($nv.Major -eq 22 -and $nv -lt [version]'22.13'){$detail+='; locked ESLint packages recommend 22.13+ (lint only)'}
    Add-Check 'Node.js' $(if($nodeOk){'OK'}else{'FAIL'}) $detail
} else { Add-Check 'Node.js' 'FAIL' 'Node.js was not found.' }
if ($npmCmd) { Add-Check 'NPM' 'OK' ((& $npmCmd.Source --version 2>$null).Trim()) } else { Add-Check 'NPM' 'FAIL' 'npm was not found.' }
$git=Get-Command git -ErrorAction SilentlyContinue; Add-Check 'Git (optional)' $(if($git){'OK'}else{'INFO'}) $(if($git){$git.Source}else{'Not installed; not required to run.'})
Add-Check 'Backend virtual environment' $(if(Test-Path (Join-Path $Backend '.venv\Scripts\python.exe')){'OK'}else{'WARN'}) (Join-Path $Backend '.venv')
$nodeModules=Join-Path $Frontend 'node_modules'; Add-Check 'Frontend dependencies' $(if(Test-Path $nodeModules){'OK'}else{'WARN'}) $(if(Test-Path $nodeModules){'node_modules exists'}else{'Run setup.ps1'})
foreach($file in @('backend\app\main.py','backend\requirements.txt','promo-roi-frontend\package.json','promo-roi-frontend\package-lock.json')) { $exists=Test-Path (Join-Path $ProjectRoot $file); Add-Check "Required file: $file" $(if($exists){'OK'}else{'FAIL'}) $(if($exists){'Found'}else{'Missing'}) }
$backendPort=8001
if($env:MARS_BACKEND_PORT){$candidate=0;if([int]::TryParse($env:MARS_BACKEND_PORT,[ref]$candidate) -and $candidate -ge 1 -and $candidate -le 65535){$backendPort=$candidate}else{Add-Check 'MARS_BACKEND_PORT' 'FAIL' 'Must be an integer from 1 through 65535.'}}
foreach($port in @($backendPort,5173)) { $free=Test-PortFree $port; Add-Check "Port $port" $(if($free){'OK'}else{'WARN'}) $(if($free){'Available'}else{'Occupied or reserved; startup requires it to be bindable'}) }
$odbc=$false
try { $odbc=@(Get-OdbcDriver -Name 'ODBC Driver 18 for SQL Server' -ErrorAction Stop).Count -gt 0 } catch { $odbc=$false }
Add-Check 'SQL Server ODBC Driver 18 (optional)' $(if($odbc){'OK'}else{'INFO'}) $(if($odbc){'Installed; only needed for SQL Server mode.'}else{'Not detected; SQLite mode does not require it.'})
if ($Json) { $results | ConvertTo-Json -Depth 4 } else { $results | Format-Table -AutoSize; if(@($results | Where-Object Status -eq 'FAIL').Count){ exit 1 } }
