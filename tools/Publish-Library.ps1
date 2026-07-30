$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "===== NADIYKA LIBRARY PUBLISHER =====" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------
# FIND LIBRARY
# ----------------------------------------------------

$LibraryRoot = Get-ChildItem "H:\" -Directory -Recurse |
    Where-Object {
        (Test-Path (Join-Path $_.FullName "cartoons")) -and
        (Test-Path (Join-Path $_.FullName "music")) -and
        (Test-Path (Join-Path $_.FullName "system"))
    } |
    Select-Object -ExpandProperty FullName -First 1

if (-not $LibraryRoot) {
    throw "Library folder not found."
}

$Cartoons = Join-Path $LibraryRoot "cartoons"
$Music     = Join-Path $LibraryRoot "music"
$System    = Join-Path $LibraryRoot "system"

$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$RepoManifest = Join-Path $RepoRoot "cloud\manifest.json"

# ----------------------------------------------------
# MANIFEST
# ----------------------------------------------------

$manifest = [ordered]@{
    version   = 1
    updated   = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    cartoons  = @()
    music     = @()
}

# ----------------------------------------------------
# CARTOONS
# ----------------------------------------------------

if (Test-Path $Cartoons) {

    Get-ChildItem $Cartoons -Directory |
    Sort-Object Name |
    ForEach-Object {

        $cat = [ordered]@{
            title = $_.Name
            files = @()
        }

        Get-ChildItem $_.FullName -File |
        Sort-Object Name |
        ForEach-Object {

            $cat.files += [ordered]@{
                title    = $_.BaseName
                file     = $_.Name
                size     = $_.Length
                modified = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
            }

        }

        $manifest.cartoons += $cat
    }
}

# ----------------------------------------------------
# MUSIC
# ----------------------------------------------------

if (Test-Path $Music) {

    Get-ChildItem $Music -File |
    Sort-Object Name |
    ForEach-Object {

        $manifest.music += [ordered]@{
            title    = $_.BaseName
            file     = $_.Name
            size     = $_.Length
            modified = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        }

    }
}

# ----------------------------------------------------
# VERSION
# ----------------------------------------------------

$OldVersion = 0

$ManifestFile = Join-Path $System "manifest.json"

if (Test-Path $ManifestFile) {

    try {

        $old = Get-Content $ManifestFile -Raw | ConvertFrom-Json
        $OldVersion = [int]$old.version

    }
    catch { }

}

$manifest.version = $OldVersion + 1

# ----------------------------------------------------
# SAVE
# ----------------------------------------------------

$json = $manifest | ConvertTo-Json -Depth 20

$json | Set-Content $ManifestFile -Encoding UTF8
$json | Set-Content $RepoManifest -Encoding UTF8

Write-Host ""
Write-Host "Manifest generated." -ForegroundColor Green

# ----------------------------------------------------
# GIT
# ----------------------------------------------------

Set-Location $RepoRoot

git add .

git commit -m "Library update v$($manifest.version)"

git push origin v2-cloud

Write-Host ""
Write-Host "DONE" -ForegroundColor Green