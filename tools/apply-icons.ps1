# ==========================================================
# Копіює згенеровані іконки (android-icons/) в android/app/src/main/res/
# Запускати ПІСЛЯ npx cap add android, стоячи в папці проєкту:
#   .\tools\apply-icons.ps1
# ==========================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "android-icons"
$dest = Join-Path $root "android\app\src\main\res"

if (-not (Test-Path $dest)) {
    Write-Host "Не знайдено android\app\src\main\res — спочатку виконай npx cap add android" -ForegroundColor Yellow
    exit 1
}

$folders = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")
foreach ($f in $folders) {
    $srcFolder = Join-Path $src $f
    $destFolder = Join-Path $dest $f
    if (Test-Path $srcFolder) {
        Copy-Item -Path (Join-Path $srcFolder "ic_launcher.png") -Destination (Join-Path $destFolder "ic_launcher.png") -Force
        Copy-Item -Path (Join-Path $srcFolder "ic_launcher_round.png") -Destination (Join-Path $destFolder "ic_launcher_round.png") -Force
        Copy-Item -Path (Join-Path $srcFolder "ic_launcher_foreground.png") -Destination (Join-Path $destFolder "ic_launcher_foreground.png") -Force
        Write-Host "Оновлено $f" -ForegroundColor Green
    }
}

Write-Host "`nГотово! Іконку застосунку замінено." -ForegroundColor Green
Write-Host "Далі: npx cap sync android -> Android Studio -> Build APK"
