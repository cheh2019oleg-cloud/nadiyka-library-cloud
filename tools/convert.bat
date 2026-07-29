@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==========================================================
REM  Конвертер мультиків для бібліотеки Надійки
REM  Перекодовує всі .avi/.xvid файли у MP4 (H.264 + AAC),
REM  сумісний з Android WebView / Capacitor.
REM
REM  Використання:
REM    1. Поклади цей файл (convert.bat) в папку з мультиками
REM    2. Двічі клікни по ньому (або запусти в PowerShell/CMD)
REM    3. Готові файли з'являться в підпапці "converted"
REM ==========================================================

set INPUT_DIR=%~dp0
set OUTPUT_DIR=%INPUT_DIR%converted

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo Шукаю відеофайли в: %INPUT_DIR%
echo Результат буде тут: %OUTPUT_DIR%
echo.

for %%F in ("%INPUT_DIR%*.avi" "%INPUT_DIR%*.mkv" "%INPUT_DIR%*.mp4" "%INPUT_DIR%*.wmv") do (
    if exist "%%F" (
        echo Конвертую: %%~nxF
        ffmpeg -y -i "%%F" ^
            -c:v libx264 -profile:v high -level 4.0 -preset medium -crf 23 ^
            -pix_fmt yuv420p ^
            -c:a aac -b:a 160k ^
            -movflags +faststart ^
            "%OUTPUT_DIR%\%%~nF.mp4"
        echo Готово: %%~nF.mp4
        echo.
    )
)

echo =============================================
echo Всі файли оброблено. Перевір папку "converted".
echo =============================================
pause
