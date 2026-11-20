# ============================================================
#  Football IQ - Android & Web Icon Generator
# ============================================================

Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\plus\.gemini\antigravity\brain\2d01a6e4-2f8f-49de-af80-1010e9db5f2f\football_iq_app_icon_v2_1795167871185.jpg"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

Write-Host "Loading source image from $sourcePath..."
$srcImage = [System.Drawing.Bitmap]::FromFile($sourcePath)

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height
    )
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $destImage = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)

    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)
    $graphics.Dispose()
    $wrapMode.Dispose()

    return $destImage
}

function Create-Circular-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Size
    )
    $destImage = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $Size, $Size)
    $graphics.SetClip($path)

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel)

    $graphics.Dispose()
    $path.Dispose()

    return $destImage
}

function Create-Adaptive-Foreground {
    param(
        [System.Drawing.Image]$Image,
        [int]$CanvasSize
    )
    # In Android adaptive icons (108dp canvas), the inner 66dp-72dp is the visible safe area.
    # The badge itself should be scaled to ~72% of the total canvas and centered.
    $destImage = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $innerScale = 0.72
    $innerSize = [int]($CanvasSize * $innerScale)
    $offset = [int](($CanvasSize - $innerSize) / 2)

    # Draw rounded or full badge scaled inside
    $destRect = New-Object System.Drawing.Rectangle($offset, $offset, $innerSize, $innerSize)
    $graphics.DrawImage($Image, $destRect, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel)

    $graphics.Dispose()
    return $destImage
}

function Create-Splash-Screen {
    param(
        [System.Drawing.Image]$LogoImage,
        [int]$Width,
        [int]$Height
    )
    $destImage = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $bgCol = [System.Drawing.ColorTranslator]::FromHtml("#070D18")
    $graphics.Clear($bgCol)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Size logo centered: around 40-50% of the smaller dimension
    $minDim = [Math]::Min($Width, $Height)
    $logoSize = [int]($minDim * 0.48)
    if ($logoSize -lt 96) { $logoSize = 96 }
    $x = [int](($Width - $logoSize) / 2)
    $y = [int](($Height - $logoSize) / 2)

    $destRect = New-Object System.Drawing.Rectangle($x, $y, $logoSize, $logoSize)
    $graphics.DrawImage($LogoImage, $destRect, 0, 0, $LogoImage.Width, $LogoImage.Height, [System.Drawing.GraphicsUnit]::Pixel)

    $graphics.Dispose()
    return $destImage
}

# 1. Save master icon to public/
$publicDir = "public"
if (-not (Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir -Force }
$webIcon512 = Resize-Image -Image $srcImage -Width 512 -Height 512
$webIcon512.Save("$publicDir/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webIcon512.Dispose()

$webFavicon = Resize-Image -Image $srcImage -Width 64 -Height 64
$webFavicon.Save("$publicDir/favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$webFavicon.Dispose()

# Save master icon in assets
$assetsDir = "public/assets"
if (-not (Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force }
Copy-Item -Path $sourcePath -Destination "$assetsDir/football-iq-icon.jpg" -Force

Write-Host "Public web icons saved."

# 2. Android Mipmap Densities
$densities = @(
    @{ Name = "mipmap-mdpi"; LauncherSize = 48; ForegroundSize = 108 },
    @{ Name = "mipmap-hdpi"; LauncherSize = 72; ForegroundSize = 162 },
    @{ Name = "mipmap-xhdpi"; LauncherSize = 96; ForegroundSize = 216 },
    @{ Name = "mipmap-xxhdpi"; LauncherSize = 144; ForegroundSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LauncherSize = 192; ForegroundSize = 432 }
)

$resDir = "android/app/src/main/res"

foreach ($d in $densities) {
    $dir = "$resDir/$($d.Name)"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

    # Standard square/squircle launcher
    $launcher = Resize-Image -Image $srcImage -Width $d.LauncherSize -Height $d.LauncherSize
    $launcher.Save("$dir/ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $launcher.Dispose()

    # Round launcher
    $round = Create-Circular-Image -Image $srcImage -Size $d.LauncherSize
    $round.Save("$dir/ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $round.Dispose()

    # Foreground adaptive launcher
    $foreground = Create-Adaptive-Foreground -Image $srcImage -CanvasSize $d.ForegroundSize
    $foreground.Save("$dir/ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $foreground.Dispose()

    Write-Host "Generated $($d.Name) icons: $($d.LauncherSize)x$($d.LauncherSize), foreground: $($d.ForegroundSize)x$($d.ForegroundSize)"
}

# 3. Android Splash Screens
$splashes = @(
    @{ Dir = "drawable"; W = 480; H = 800 },
    @{ Dir = "drawable-port-hdpi"; W = 480; H = 800 },
    @{ Dir = "drawable-port-mdpi"; W = 320; H = 480 },
    @{ Dir = "drawable-port-xhdpi"; W = 720; H = 1280 },
    @{ Dir = "drawable-port-xxhdpi"; W = 960; H = 1600 },
    @{ Dir = "drawable-port-xxxhdpi"; W = 1280; H = 1920 },
    @{ Dir = "drawable-land-hdpi"; W = 800; H = 480 },
    @{ Dir = "drawable-land-mdpi"; W = 480; H = 320 },
    @{ Dir = "drawable-land-xhdpi"; W = 1280; H = 720 },
    @{ Dir = "drawable-land-xxhdpi"; W = 1600; H = 960 },
    @{ Dir = "drawable-land-xxxhdpi"; W = 1920; H = 1280 }
)

foreach ($s in $splashes) {
    $targetDir = "$resDir/$($s.Dir)"
    if (Test-Path $targetDir) {
        $splash = Create-Splash-Screen -LogoImage $srcImage -Width $s.W -Height $s.H
        $splash.Save("$targetDir/splash.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $splash.Dispose()
        Write-Host "Generated splash for $($s.Dir) ($($s.W)x$($s.H))"
    }
}

$srcImage.Dispose()
Write-Host "All icons & splash screens generated successfully!"
