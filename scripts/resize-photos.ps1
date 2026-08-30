<#
  Resizes photos for the Photography gallery.

  Usage:
    powershell -File scripts\resize-photos.ps1 -Source "C:\path\to\originals"

  Reads every .jpg/.jpeg/.png in -Source, resizes so the long edge is
  -MaxDimension (default 2000px), re-encodes as JPEG at -Quality (default 82),
  and writes 01.jpg, 02.jpg, ... into work\photography\images\ (in the order
  the files are picked up — sort your source filenames first if order matters).
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Source,
  [string]$Destination = (Join-Path $PSScriptRoot "..\work\photography\images"),
  [int]$MaxDimension = 2000,
  [int]$Quality = 82
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
  throw "Source folder not found: $Source"
}
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

$files = Get-ChildItem -Path $Source -Include *.jpg, *.jpeg, *.png -File -Recurse | Sort-Object Name
if ($files.Count -eq 0) {
  throw "No .jpg/.jpeg/.png files found in $Source"
}

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)

$i = 0
foreach ($file in $files) {
  $i++
  $outName = "{0:D2}.jpg" -f $i
  $outPath = Join-Path $Destination $outName

  $img = [System.Drawing.Image]::FromFile($file.FullName)
  try {
    $scale = [Math]::Min(1.0, $MaxDimension / [Math]::Max($img.Width, $img.Height))
    $newW = [Math]::Max(1, [int]($img.Width * $scale))
    $newH = [Math]::Max(1, [int]($img.Height * $scale))

    $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($img, 0, 0, $newW, $newH)
      } finally { $g.Dispose() }

      $bmp.Save($outPath, $jpegCodec, $encoderParams)
      Write-Host "$($file.Name)  ->  $outName  (${newW}x${newH})"
    } finally { $bmp.Dispose() }
  } finally { $img.Dispose() }
}

Write-Host "`nDone. $i image(s) written to $Destination"
