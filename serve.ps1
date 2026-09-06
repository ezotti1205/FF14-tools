# Minimal static file server for local use.
#   powershell -ExecutionPolicy Bypass -File serve.ps1
# Then open http://localhost:8123/ in a browser. Ctrl+C to stop.
param([int]$Port = 8124)

$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix  (Ctrl+C to stop)"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    # A single bad request must not take the whole server down.
    try {
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
      if ($rel -eq "/") { $rel = "/index.html" }
      $path = Join-Path $root ($rel.TrimStart("/") -replace "/", "\")
      # keep requests inside the served directory
      $full = [System.IO.Path]::GetFullPath($path)
      if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root))) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
        $ctx.Response.StatusCode = 403
        $ctx.Response.ContentType = "text/plain; charset=utf-8"
      } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $ct = $mime[$ext]
        if (-not $ct) { $ct = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $ctx.Response.ContentType = $ct
      } else {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $ctx.Response.StatusCode = 404
        $ctx.Response.ContentType = "text/plain; charset=utf-8"
      }
      # Set the length before touching .Headers: adding a response header can
      # commit the headers early, after which ContentLength64 is ignored and
      # OutputStream.Write throws ProtocolViolationException.
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.AddHeader("Cache-Control", "no-store")
      if ($ctx.Request.HttpMethod -ne "HEAD") {
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch {
      Write-Host "  ! $($ctx.Request.Url.AbsolutePath): $($_.Exception.Message)"
      try { $ctx.Response.StatusCode = 500 } catch {}
    } finally {
      try { $ctx.Response.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
