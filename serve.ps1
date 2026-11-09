# Local preview server: powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8095]
# The website lives in this folder (the same layout any static host serves).
param([int]$Port = 8095, [string]$Folder = '.')

$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot $Folder)).TrimEnd('\')
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.gif' = 'image/gif'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.mp4' = 'video/mp4'
  '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.ttf' = 'font/ttf'; '.ico' = 'image/x-icon'
  '.webmanifest' = 'application/manifest+json'; '.txt' = 'text/plain; charset=utf-8'; '.xml' = 'application/xml'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    # Dev helper used only on this computer: saves preview shots sent by tools\shots.js into assets\img\shots
    if ($ctx.Request.HttpMethod -eq 'POST' -and $ctx.Request.Url.AbsolutePath -eq '/__shot') {
      $name = ($ctx.Request.QueryString['name'] -replace '[^a-zA-Z0-9_-]', '')
      if ($name) {
        $dir = Join-Path $root 'assets\img\shots'
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
        $file = [IO.File]::Create((Join-Path $dir "$name.jpg"))
        $ctx.Request.InputStream.CopyTo($file)
        $file.Close()
        $res.StatusCode = 204
      } else { $res.StatusCode = 400 }
      continue
    }
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if (Test-Path $path -PathType Container) {
      # like a real static host: /models/1 -> /models/1/ so relative links resolve
      if (-not $ctx.Request.Url.AbsolutePath.EndsWith('/')) {
        $res.Redirect($ctx.Request.Url.AbsolutePath + '/')
        continue
      }
      $path = Join-Path $path 'index.html'
    }
    if (-not (Test-Path $path -PathType Leaf)) { $res.StatusCode = 404; $path = Join-Path $root '404.html' }
    if ($path.StartsWith($root) -and (Test-Path $path -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($path)
      $type = $mime[[IO.Path]::GetExtension($path).ToLower()]
      $res.ContentType = if ($type) { $type } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $res.StatusCode = 500
  } finally {
    $res.Close()
  }
}
