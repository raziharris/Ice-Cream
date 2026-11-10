$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot
$key = Join-Path $repo '..\tencent-key\RaziKey.pem'
$archive = Join-Path $env:TEMP ('aiscreme-' + [guid]::NewGuid() + '.tar.gz')
Push-Location $repo
try {
    tar.exe -czf $archive server.mjs dist
    if ($LASTEXITCODE) { throw 'Archive failed' }
    scp.exe -i $key $archive ubuntu@43.156.11.241:/tmp/aiscreme-calendar.tar.gz
    if ($LASTEXITCODE) { throw 'Upload failed' }
    scp.exe -i $key deploy-nginx.mjs ubuntu@43.156.11.241:/tmp/aiscreme-nginx.mjs
    if ($LASTEXITCODE) { throw 'Upload failed' }
    Get-Content -Raw deploy-calendar.sh | ssh.exe -i $key -o BatchMode=yes ubuntu@43.156.11.241 "tr -d '\r' | bash -s"
    if ($LASTEXITCODE) { throw 'Deployment failed' }
} finally {
    Pop-Location
    Remove-Item -LiteralPath $archive -ErrorAction SilentlyContinue
}
