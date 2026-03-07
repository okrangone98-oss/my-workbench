param(
    [string]$MapPath = "data/g-drive-phase1-map-2026-03-07.csv",
    [switch]$ApplyMoves
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $MapPath)) {
    throw "Map file not found: $MapPath"
}

$rows = Import-Csv -Path $MapPath

foreach ($row in $rows) {
    $targetRoot = $row.target_root
    if (-not (Test-Path $targetRoot)) {
        New-Item -ItemType Directory -Path $targetRoot | Out-Null
    }
}

if (-not $ApplyMoves) {
    Write-Host "Safe mode complete. Structure verified. No moves executed."
    exit 0
}

foreach ($row in $rows) {
    if ($row.action -ne "move") { continue }
    $source = $row.source_path
    $targetRoot = $row.target_root
    $leaf = Split-Path -Path $source -Leaf
    $target = Join-Path $targetRoot $leaf
    if (-not (Test-Path $source)) { continue }
    if (Test-Path $target) { continue }
    Move-Item -Path $source -Destination $target
}

Write-Host "Apply mode complete. Move actions executed."
