# Builds every logo file from the traced contours: shared/logo.js (used by the 3D and the page headers), SVG variants and icons.
# Run after tools\trace-logo.ps1:  powershell -ExecutionPolicy Bypass -File tools\build-logo.ps1
param([string]$Trace = "$PSScriptRoot\logo-trace.json", [string]$Root = "$PSScriptRoot\..")
Add-Type -AssemblyName System.Drawing
$j = Get-Content $Trace -Raw | ConvertFrom-Json

# Which traced contour is what (ids printed by trace-logo.ps1)
$snowIds = 1, 2, 3, 4, 5, 6, 8, 9       # white shapes inside the body: shovel blade, pick collar, snow caps
$gapId = 7                               # the white strip under the mountain
$letterIds = 11, 13, 10, 14, 12          # M . H . C

$minx = 1e9; $miny = 1e9; $maxx = -1e9; $maxy = -1e9
foreach ($l in $j.loops) { $minx = [Math]::Min($minx, $l.b[0]); $miny = [Math]::Min($miny, $l.b[1]); $maxx = [Math]::Max($maxx, $l.b[2]); $maxy = [Math]::Max($maxy, $l.b[3]) }
$scale = 1000.0 / ($maxy - $miny)
$aspect = [Math]::Round(($maxx - $minx) * $scale / 1000, 4)
$ci = [Globalization.CultureInfo]::InvariantCulture
function Norm($loop) {
  $o = New-Object System.Collections.ArrayList
  for ($i = 0; $i -lt $loop.p.Count; $i += 2) {
    [void]$o.Add([Math]::Round(($loop.p[$i] - $minx) * $scale, 1))
    [void]$o.Add([Math]::Round(($loop.p[$i + 1] - $miny) * $scale, 1))
  }
  return , $o
}
function Arr($a) { return '[' + (($a | ForEach-Object { $_.ToString('0.#', $ci) }) -join ',') + ']' }
function PathD($a) {
  $s = New-Object System.Text.StringBuilder
  for ($i = 0; $i -lt $a.Count; $i += 2) { [void]$s.Append($(if ($i -eq 0) { 'M' } else { 'L' })); [void]$s.Append($a[$i].ToString('0.#', $ci)); [void]$s.Append(' '); [void]$s.Append($a[$i + 1].ToString('0.#', $ci)) }
  [void]$s.Append('Z'); return $s.ToString()
}
$body = Norm ($j.loops | Where-Object { $_.id -eq 0 })
$gap = Norm ($j.loops | Where-Object { $_.id -eq $gapId })
$snow = @(); foreach ($id in $snowIds) { $snow += , (Norm ($j.loops | Where-Object { $_.id -eq $id })) }
$letters = @(); foreach ($id in $letterIds) { $letters += , (Norm ($j.loops | Where-Object { $_.id -eq $id })) }

$dBody = (PathD $body) + (PathD $gap) + (($snow | ForEach-Object { PathD $_ }) -join '')
$dSnow = ($snow | ForEach-Object { PathD $_ }) -join ''
$dLetters = ($letters | ForEach-Object { PathD $_ }) -join ''

$js = "/* M.H.C logo as vector contours, traced from the company's own file by tools/trace-logo.ps1 and tools/build-logo.ps1. y grows downward, height = 1000. */`n"
$js += "window.MHC_LOGO = {`n  a: $($aspect.ToString($ci)),`n"
$js += "  body: $(Arr $body),`n  gap: $(Arr $gap),`n"
$js += "  snow: [$(($snow | ForEach-Object { Arr $_ }) -join ',')],`n"
$js += "  letters: [$(($letters | ForEach-Object { Arr $_ }) -join ',')],`n"
$js += "  d: { body: '$dBody', snow: '$dSnow', letters: '$dLetters' }`n};`n"
[IO.File]::WriteAllText("$Root\shared\logo.js", $js, (New-Object Text.UTF8Encoding($false)))

$vw = [Math]::Round($aspect * 1000)
$pad = 28
$vb = "-$pad -$pad $($vw + 2 * $pad) $(1000 + 2 * $pad)"
$gold = '#B48B0B'; $goldHi = '#D9AE2E'; $ink = '#0D0D0D'
function Svg($inner) { "<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"$vb`">$inner</svg>" }
# Original: black body, gold letters (for light backgrounds)
[IO.File]::WriteAllText("$Root\assets\logo\mark-light-bg.svg", (Svg "<path fill=`"$ink`" fill-rule=`"evenodd`" d=`"$dBody`"/><path fill=`"$gold`" d=`"$dLetters`"/>"))
# Official look on dark backgrounds: black body with the gold outline, white snow, gold letters
[IO.File]::WriteAllText("$Root\assets\logo\mark-dark-bg.svg", (Svg "<path fill=`"#fff`" d=`"$dSnow`"/><path fill=`"$ink`" stroke=`"$goldHi`" stroke-width=`"9`" stroke-linejoin=`"round`" fill-rule=`"evenodd`" d=`"$dBody`"/><path fill=`"$goldHi`" d=`"$dLetters`"/>"))
# One colour, for small sizes and watermarks
[IO.File]::WriteAllText("$Root\assets\logo\mark-gold.svg", (Svg "<path fill=`"$goldHi`" fill-rule=`"evenodd`" d=`"$dBody`"/><path fill=`"$goldHi`" d=`"$dLetters`"/>"))
[IO.File]::WriteAllText("$Root\assets\logo\mark-white.svg", (Svg "<path fill=`"#fff`" fill-rule=`"evenodd`" d=`"$dBody`"/><path fill=`"#fff`" d=`"$dLetters`"/>"))

# Icons: gold mark on a black rounded square
function Pts($a, $s, $ox, $oy) {
  $p = New-Object 'System.Drawing.PointF[]' ($a.Count / 2)
  for ($i = 0; $i -lt $p.Length; $i++) { $p[$i] = New-Object System.Drawing.PointF ([single]($a[$i * 2] * $s + $ox)), ([single]($a[$i * 2 + 1] * $s + $oy)) }
  return , $p
}
foreach ($size in 32, 180, 192, 512) {
  $b = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(13, 13, 13))
  $s = $size * 0.72 / 1000 / [Math]::Max($aspect, 1); $ox = ($size - $aspect * 1000 * $s) / 2; $oy = ($size - 1000 * $s) / 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath ([System.Drawing.Drawing2D.FillMode]::Alternate)
  $path.AddPolygon((Pts $body $s $ox $oy)); $path.AddPolygon((Pts $gap $s $ox $oy)); foreach ($x in $snow) { $path.AddPolygon((Pts $x $s $ox $oy)) }
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($goldHi))
  $g.FillPath($brush, $path)
  foreach ($x in $letters) { $g.FillPolygon($brush, (Pts $x $s $ox $oy)) }
  $g.Dispose(); $b.Save("$Root\assets\logo\icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}
"aspect $aspect  points body $($body.Count/2) gap $($gap.Count/2) letters $(($letters | ForEach-Object { $_.Count/2 }) -join ',')"
"logo.js size: " + (Get-Item "$Root\shared\logo.js").Length
