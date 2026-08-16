# mirror-live-site.ps1
# Downloads the current live 3dprintcraft.gr into .\current\ so we have a
# working copy to redesign. Re-runnable: overwrites what it downloads.
#
# Note: the live host answers /portfolio.html with a 308 redirect to /portfolio,
# and Windows PowerShell 5.1 does not follow 308. So pages are fetched from
# their clean URL and saved under the .html name the site's links use.

$ErrorActionPreference = 'Stop'
$Base = 'https://3dprintcraft.gr'
$Out  = Join-Path $PSScriptRoot 'current'

# saved-name -> live URL path
$Pages = [ordered]@{
    'index.html'     = '/'
    'portfolio.html' = '/portfolio'
    'filaments.html' = '/filaments'
    'contact.html'   = '/contact'
}

New-Item -ItemType Directory -Force -Path $Out | Out-Null
$assets = New-Object System.Collections.Generic.HashSet[string]

function Get-Remote([string]$UrlPath, [string]$SaveAs) {
    $url  = "$Base/$($UrlPath.TrimStart('/') -replace '\\','/')"
    $dest = Join-Path $Out $SaveAs
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing
        # RawContentStream keeps bytes intact for both text and binary files
        [System.IO.File]::WriteAllBytes($dest, $resp.RawContentStream.ToArray())
        $kb = [math]::Round((Get-Item $dest).Length / 1KB)
        Write-Host ("  ok   {0,-45} {1,6} KB" -f $SaveAs, $kb)
        return $true
    }
    catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host ("  miss {0,-45} {1}" -f $SaveAs, $(if ($code) { "HTTP $code" } else { $_.Exception.Message })) -ForegroundColor DarkYellow
        if (Test-Path $dest) { Remove-Item $dest -Force }
        return $false
    }
}

Write-Host 'Pages:' -ForegroundColor Cyan
foreach ($name in $Pages.Keys) {
    if (-not (Get-Remote $Pages[$name] $name)) { continue }
    $html = [System.IO.File]::ReadAllText((Join-Path $Out $name), [System.Text.Encoding]::UTF8)
    [regex]::Matches($html, '(?:src|href|data-full|content)="(assets/[^"]+)"') |
        ForEach-Object { [void]$assets.Add($_.Groups[1].Value) }
}

Write-Host "Assets ($($assets.Count) found):" -ForegroundColor Cyan
foreach ($a in $assets) { [void](Get-Remote $a $a) }

# fonts and images referenced from inside the CSS
$cssPath = Join-Path $Out 'assets/css/site.css'
if (Test-Path $cssPath) {
    $css = Get-Content $cssPath -Raw
    $cssRefs = [regex]::Matches($css, 'url\(["'']?([^")'']+)["'']?\)') |
        ForEach-Object { $_.Groups[1].Value } |
        Where-Object { $_ -notmatch '^(data:|https?:)' } |
        Select-Object -Unique

    if ($cssRefs) {
        Write-Host 'Fonts / CSS assets:' -ForegroundColor Cyan
        foreach ($ref in $cssRefs) {
            $resolved = if ($ref -match '^\.\./') { $ref -replace '^\.\./', 'assets/' }
                        elseif ($ref -match '^assets/') { $ref }
                        else { "assets/css/$ref" }
            [void](Get-Remote $resolved ($resolved -replace '/+', '/'))
        }
    }
}

Write-Host 'Extras:' -ForegroundColor Cyan
foreach ($extra in @('sitemap.xml', 'robots.txt', 'favicon.ico')) {
    [void](Get-Remote $extra $extra)
}

$files = Get-ChildItem $Out -Recurse -File
$mb = [math]::Round(($files | Measure-Object Length -Sum).Sum / 1MB, 2)
Write-Host ''
Write-Host "Downloaded $($files.Count) files, $mb MB -> $Out" -ForegroundColor Green
