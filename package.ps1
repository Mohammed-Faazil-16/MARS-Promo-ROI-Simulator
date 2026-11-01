& (Join-Path $PSScriptRoot 'scripts\package.ps1') @args
if(-not $?){exit 1}
exit 0
