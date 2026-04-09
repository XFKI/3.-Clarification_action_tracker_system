param(
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$dir = Split-Path -Parent $OutputPath
if (-not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $rect,
  [System.Drawing.Color]::FromArgb(255, 12, 148, 136),
  [System.Drawing.Color]::FromArgb(255, 59, 130, 246),
  45
)
$g.FillEllipse($bg, 8, 8, 240, 240)

$ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 255, 255, 255), 8)
$g.DrawEllipse($ringPen, 14, 14, 228, 228)

$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
$cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 255, 255, 255), 4)
$g.FillRectangle($cardBrush, 48, 56, 160, 120)
$g.DrawRectangle($cardPen, 48, 56, 160, 120)

$tail = [System.Drawing.Point[]]@(
  (New-Object System.Drawing.Point 122, 176),
  (New-Object System.Drawing.Point 146, 198),
  (New-Object System.Drawing.Point 146, 174)
)
$g.FillPolygon($cardBrush, $tail)

$linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 30, 64, 175), 8)
$g.DrawLine($linePen, 70, 86, 186, 86)
$g.DrawLine($linePen, 70, 111, 170, 111)
$g.DrawLine($linePen, 70, 136, 146, 136)

$tickPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 245, 158, 11), 10)
$tickPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$tickPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($tickPen, 172, 144, 188, 160)
$g.DrawLine($tickPen, 188, 160, 220, 124)

$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fs = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

$g.Dispose()
$bmp.Dispose()
