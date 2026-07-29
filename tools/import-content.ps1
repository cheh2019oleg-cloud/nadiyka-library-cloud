# ==========================================================
# Імпорт готового контенту в проєкт (PowerShell)
#
# Використання:
#   1. Постав правильні шляхи нижче ($videoCategories, $musicSourceDir)
#   2. Запусти в PowerShell, стоячи в папці проєкту:
#        .\tools\import-content.ps1
#   3. Файли скопіюються в www\media\..., згенерується www\content.json
#   4. Далі: npx cap sync android -> Android Studio -> Build APK
# ==========================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ---------- НАЛАШТУВАННЯ ----------
$videoCategories = @(
    @{ Title = "Маша та Ведмідь"; Icon = "🐻"; SourceDir = "C:\Users\getma\OneDrive\Desktop\Маша та Ведмідь" }
    @{ Title = "Радянські мультики"; Icon = "⭐"; SourceDir = "C:\Users\getma\OneDrive\Desktop\Радянські українські мультики" }
)
$musicSourceDir = "C:\Users\getma\OneDrive\Desktop\Моя музика"
# -----------------------------------

$videoExt = @(".mp4", ".webm", ".m4v", ".mkv", ".avi")
$audioExt = @(".mp3", ".m4a", ".aac", ".wav", ".ogg")

$root = Split-Path -Parent $PSScriptRoot
$mediaVideos = Join-Path $root "www\media\videos"
$mediaMusic  = Join-Path $root "www\media\music"
$contentJson = Join-Path $root "www\content.json"

function Get-Slug($name) {
    $s = $name.ToLower()
    $s = [regex]::Replace($s, '[^\p{L}\p{N}]+', '_')
    return $s.Trim('_')
}
function Get-SafeFileName($name) {
    return ($name -replace '[\\/:\*\?"<>\|]', '_')
}
function Get-TitleFromFile($cleanName) {
    $t = [System.IO.Path]::GetFileNameWithoutExtension($cleanName)
    return ($t -replace '_+', ' ').Trim()
}

# ---------- Мультфільми ----------
Write-Host "Копіюю мультики..." -ForegroundColor Cyan
$categoriesResult = @()

foreach ($cat in $videoCategories) {
    if (-not (Test-Path $cat.SourceDir)) {
        Write-Host "  Папку не знайдено, пропускаю: $($cat.SourceDir)" -ForegroundColor Yellow
        continue
    }
    $slug = Get-Slug $cat.Title
    $destDir = Join-Path $mediaVideos $slug
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null

    $files = Get-ChildItem -Path $cat.SourceDir -File | Where-Object { $videoExt -contains $_.Extension.ToLower() } | Sort-Object Name

    $episodes = @()
    foreach ($f in $files) {
        $clean = Get-SafeFileName $f.Name
        $dest = Join-Path $destDir $clean
        Copy-Item -Path $f.FullName -Destination $dest -Force
        $title = Get-TitleFromFile $clean
        $episodes += @{ title = $title; file = "media/videos/$slug/$clean" }
        Write-Host "  + $($f.Name)"
    }

    if ($episodes.Count -gt 0) {
        $categoriesResult += @{ id = $slug; title = $cat.Title; icon = $cat.Icon; episodes = $episodes }
        Write-Host "Категорія '$($cat.Title)': $($episodes.Count) файл(ів)" -ForegroundColor Green
    } else {
        Write-Host "  У папці не знайдено відеофайлів" -ForegroundColor Yellow
    }
}

# ---------- Музика ----------
Write-Host "`nКопіюю музику..." -ForegroundColor Cyan
$musicResult = @()

if (Test-Path $musicSourceDir) {
    New-Item -ItemType Directory -Force -Path $mediaMusic | Out-Null
    $files = Get-ChildItem -Path $musicSourceDir -File | Where-Object { $audioExt -contains $_.Extension.ToLower() } | Sort-Object Name

    foreach ($f in $files) {
        $clean = Get-SafeFileName $f.Name
        $dest = Join-Path $mediaMusic $clean
        Copy-Item -Path $f.FullName -Destination $dest -Force
        $title = Get-TitleFromFile $clean
        $musicResult += @{ title = $title; file = "media/music/$clean" }
        Write-Host "  + $($f.Name)"
    }
    Write-Host "Музика: $($musicResult.Count) файл(ів)" -ForegroundColor Green
} else {
    Write-Host "Папку з музикою не знайдено: $musicSourceDir" -ForegroundColor Yellow
}

# ---------- Запис content.json ----------
$content = @{ videoCategories = $categoriesResult; music = $musicResult }
$json = $content | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($contentJson, $json, [System.Text.Encoding]::UTF8)

Write-Host "`nГотово! Записано $contentJson" -ForegroundColor Green
Write-Host "Далі: npx cap sync android -> відкрити в Android Studio -> Build APK"