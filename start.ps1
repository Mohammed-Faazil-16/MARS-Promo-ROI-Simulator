& (Join-Path $PSScriptRoot 'scripts\start.ps1') @args
if(-not $?){exit 1}
exit 0
