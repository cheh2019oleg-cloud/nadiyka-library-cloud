Write-Host ""
Write-Host "==============================="
Write-Host " NADIYKA LIBRARY PUBLISHER"
Write-Host "==============================="
Write-Host ""

$manifest = @{
    version = 2
    updated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    categories = @()
    music = @()
    files = @()
}

$manifest | ConvertTo-Json -Depth 10 | Set-Content ".\cloud\manifest.json" -Encoding UTF8

Write-Host ""
Write-Host "Manifest created."
Write-Host ""

git add .

git commit -m "Automatic manifest update"

git push origin v2-cloud

Write-Host ""
Write-Host "Cloud updated successfully."
Write-Host ""