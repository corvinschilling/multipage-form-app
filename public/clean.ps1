Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Antigravitiy\multipage-form-app\public\logo.png")
$bmp = New-Object System.Drawing.Bitmap -ArgumentList $img
$color = $bmp.GetPixel(0,0)
$bmp.MakeTransparent($color)
$bmp.Save("C:\Antigravitiy\multipage-form-app\public\logo_clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
