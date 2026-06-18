# PowerShell script to download and extract portable Node.js locally
$ErrorActionPreference = "Stop"

$nodeZipUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$destinationFolder = Join-Path $PSScriptRoot "node-portable"
$zipFile = Join-Path $PSScriptRoot "node.zip"

if (-not (Test-Path $destinationFolder)) {
    New-Item -ItemType Directory -Force -Path $destinationFolder | Out-Null
    
    Write-Host "Downloading portable Node.js (v20.11.1) from $nodeZipUrl ..."
    Invoke-WebRequest -Uri $nodeZipUrl -OutFile $zipFile
    
    Write-Host "Extracting Node.js archive..."
    Expand-Archive -Path $zipFile -DestinationPath $destinationFolder
    
    Write-Host "Cleaning up ZIP archive..."
    Remove-Item $zipFile -Force
    
    Write-Host "Portable Node.js set up successfully in: $destinationFolder"
} else {
    Write-Host "Node.js portable directory already exists."
}

# Add test info
$binPath = Join-Path $destinationFolder "node-v20.11.1-win-x64"
$nodeExe = Join-Path $binPath "node.exe"
if (Test-Path $nodeExe) {
    Write-Host "Verification successful: node.exe exists."
    & $nodeExe -v
} else {
    Write-Error "Verification failed: node.exe not found at $nodeExe."
}
