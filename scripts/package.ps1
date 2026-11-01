$ErrorActionPreference='Stop'
$ProjectRoot=Split-Path -Parent $PSScriptRoot
$OutputPath=Join-Path $ProjectRoot 'MARS_Promo_ROI_Portable.zip'
$StageRoot=Join-Path ([IO.Path]::GetTempPath()) ('mars-promo-roi-package-'+[guid]::NewGuid().ToString('N'))
$TopName='MARS_Promo_ROI'
$StageProject=Join-Path $StageRoot $TopName
$excludedDirectoryNames=@('.git','.venv','node_modules','__pycache__','.pytest_cache','dist','build','coverage','.mypy_cache','.ruff_cache','logs','tmp','temp')
$excludedExtensions=@('.db','.sqlite','.sqlite3','.log','.pyc','.pyo','.tmp','.temp','.bak')
try {
    New-Item -ItemType Directory -Path $StageProject -Force | Out-Null
    $sourceDirs=@('backend','promo-roi-frontend','docs','scripts')
    foreach($directory in $sourceDirs){
        $source=Join-Path $ProjectRoot $directory
        if(-not (Test-Path $source)){throw "Required project folder is missing: $directory"}
        Get-ChildItem -LiteralPath $source -File -Recurse -Force | ForEach-Object {
            $relative=$_.FullName.Substring($source.Length).TrimStart('\','/')
            $parts=$relative -split '[\\/]'
            $skip=$false
            foreach($part in $parts){if($excludedDirectoryNames -contains $part){$skip=$true;break}}
            if($skip){return}
            if($excludedExtensions -contains $_.Extension.ToLowerInvariant()){return}
            if($_.Name -eq '.env' -or $_.Name -match '^\.env\.(?!example$)'){return}
            if($_.Name -match '\.(db|sqlite|sqlite3)(-wal|-shm|-journal)?$'){return}
            if($_.Name -match '(^|\.)secrets?(\.|$)|credentials?' -or $_.Name -match '\.(pem|pfx|p12|key)$'){return}
            $destination=Join-Path (Join-Path $StageProject $directory) $relative
            $parent=Split-Path -Parent $destination
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
            Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
        }
    }
    foreach($file in @('README.md','.gitignore','setup.ps1','start.ps1','package.ps1')){
        $source=Join-Path $ProjectRoot $file
        if(Test-Path $source){Copy-Item -LiteralPath $source -Destination (Join-Path $StageProject $file) -Force}
    }
    foreach($required in @('backend\requirements.txt','backend\.env.example','promo-roi-frontend\package.json','promo-roi-frontend\package-lock.json','README.md')){
        if(-not (Test-Path (Join-Path $StageProject $required))){throw "Package is missing required file $required"}
    }
    if(Test-Path $OutputPath){Remove-Item -LiteralPath $OutputPath -Force}
    Compress-Archive -Path $StageProject -DestinationPath $OutputPath -CompressionLevel Optimal
    if(-not (Test-Path $OutputPath)){throw 'ZIP archive was not created.'}
    $zip=[IO.Compression.ZipFile]::OpenRead($OutputPath)
    try {
        $entries=@($zip.Entries | ForEach-Object FullName)
        if(-not $entries.Count -or @($entries | Where-Object {$_ -notmatch ('^'+[regex]::Escape($TopName)+'/')}).Count){throw 'ZIP does not contain exactly the expected single top-level folder.'}
        $bad=@($entries | Where-Object {$_ -match '(^|/)(node_modules|\.venv|\.git|__pycache__|\.pytest_cache|dist|build|logs|tmp|temp)(/|$)' -or $_ -match '(^|/)\.env($|\.)' -and $_ -notmatch '\.env\.example$' -or $_ -match '\.(db|sqlite|sqlite3)(-wal|-shm|-journal)?$'})
        if($bad.Count){throw ('ZIP contains excluded content: '+($bad -join ', '))}
    } finally { $zip.Dispose() }
    Write-Host "Portable ZIP created and verified: $OutputPath" -ForegroundColor Green
    Write-Host "Archive size: $([math]::Round((Get-Item $OutputPath).Length/1MB,2)) MB"
} finally {
    if(Test-Path $StageRoot){Remove-Item -LiteralPath $StageRoot -Recurse -Force -ErrorAction SilentlyContinue}
}
