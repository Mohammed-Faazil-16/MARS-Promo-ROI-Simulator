& (Join-Path $PSScriptRoot 'scripts\setup.ps1') @args
if(-not $?){exit 1}
exit 0
