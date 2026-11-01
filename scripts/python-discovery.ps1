function Get-CompatiblePython {
    $candidates = [System.Collections.Generic.List[string]]::new()
    $candidateSet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

    function Add-PythonCandidate([string]$Candidate) {
        if ([string]::IsNullOrWhiteSpace($Candidate)) { return }
        $path = $Candidate.Trim().Trim('"')
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return }
        try { $resolved = (Resolve-Path -LiteralPath $path -ErrorAction Stop).Path }
        catch { return }
        if ($candidateSet.Add($resolved)) { $candidates.Add($resolved) }
    }

    $launcher = Get-Command py -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($launcher -and $launcher.Source -and (Test-Path -LiteralPath $launcher.Source -PathType Leaf)) {
        try {
            $launcherOutput = & $launcher.Source -0p 2>$null
            if ($LASTEXITCODE -eq 0) {
                foreach ($line in $launcherOutput) {
                    if ($line -match '(?<path>(?:[A-Za-z]:\\|\\\\)(?:[^\\\r\n]+\\)*python(?:3|w)?\.exe)\s*$') {
                        Add-PythonCandidate $Matches['path']
                    }
                }
            }
        } catch {
            # A launcher that cannot enumerate installations is optional; use PATH discovery below.
        }
    }

    foreach ($commandName in @('python', 'python3')) {
        $command = Get-Command $commandName -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command -and $command.Source) { Add-PythonCandidate $command.Source }
    }

    $valid = [System.Collections.Generic.List[object]]::new()
    foreach ($candidate in $candidates) {
        # The path is checked before invocation; the call operator passes it as one executable path,
        # including when a parent directory contains spaces.
        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        try {
            $output = & $candidate -c "import sys; print(sys.executable); print('.'.join(map(str, sys.version_info[:3])))" 2>$null
            $exitCode = $LASTEXITCODE
        } catch {
            continue
        }
        if ($exitCode -ne 0 -or @($output).Count -lt 2) { continue }

        $actualExecutable = ([string]$output[0]).Trim()
        if ([string]::IsNullOrWhiteSpace($actualExecutable) -or -not (Test-Path -LiteralPath $actualExecutable -PathType Leaf)) { continue }
        try { $version = [version]([string]$output[1]).Trim() }
        catch { continue }
        if ($version -ge [version]'3.11' -and $version -lt [version]'3.15') {
            $valid.Add([pscustomobject]@{ Path = (Resolve-Path -LiteralPath $actualExecutable).Path; Version = $version })
        }
    }

    return $valid | Sort-Object Version -Descending | Select-Object -First 1
}
