# Windows: runs blender/build.py to make blender/saah.blend, src/data/saah.glb and src/data/strata.webp.
#   .\blender\build.ps1             build the .blend and the web assets
#   .\blender\build.ps1 --render    also render docs/render-hero.jpg and docs/render-nisar.jpg with Cycles
# Needs Blender 5.2 or later. Set $env:BLENDER = 'C:\path\to\blender.exe' if it is not found.
# If scripts are blocked: powershell -ExecutionPolicy Bypass -File blender\build.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$candidates = @($env:BLENDER, (Get-Command blender -ErrorAction SilentlyContinue).Source)
$candidates += Get-ChildItem "$env:ProgramFiles\Blender Foundation\*\blender.exe" -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | ForEach-Object FullName  # newest installed version first
$blender = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $blender) {
  Write-Host "Blender not found. Install 5.2 or later from https://www.blender.org/download/ or set `$env:BLENDER to blender.exe" -ForegroundColor Red
  exit 1
}

& $blender -b -P blender/build.py '--' @args
exit $LASTEXITCODE
