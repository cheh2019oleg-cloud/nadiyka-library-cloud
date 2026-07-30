Write-Host ""
Write-Host "===== NADIYKA LIBRARY PUBLISHER ====="
Write-Host ""

$cloudFolder = ".\cloud"
$videoFolder = ".\www\media\video"
$musicFolder = ".\www\media\music"

$manifest = @{
    version = 3
    updated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    categories = @()
    music = @()
    files = @()
}

if(Test-Path $videoFolder){

    Get-ChildItem $videoFolder -Directory | ForEach-Object{

        $category=@{
            title=$_.Name
            icon="🎬"
            episodes=@()
        }

        Get-ChildItem $_.FullName -File | ForEach-Object{

            $episode=@{
                title=$_.BaseName
                file="media/video/$($_.Directory.Name)/$($_.Name)"
            }

            $category.episodes += $episode

            $manifest.files += $episode.file

        }

        $manifest.categories += $category

    }

}

if(Test-Path $musicFolder){

    Get-ChildItem $musicFolder -File | ForEach-Object{

        $song=@{

            title=$_.BaseName

            file="media/music/$($_.Name)"

        }

        $manifest.music += $song

        $manifest.files += $song.file

    }

}

$manifest | ConvertTo-Json -Depth 20 | Set-Content "$cloudFolder\manifest.json" -Encoding UTF8

git add .
git commit -m "Library updated"
git push origin v2-cloud

Write-Host ""
Write-Host "DONE"
Write-Host ""