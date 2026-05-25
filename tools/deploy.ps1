# Build Hugo site and publish it to the `deploy` branch.
#
# Usage:   .\tools\deploy.ps1
# Requires: hugo on PATH, clean working tree on the source branch.

$ErrorActionPreference = 'Stop'

# Always run from the repo root.
$RepoRoot = git rev-parse --show-toplevel
Set-Location $RepoRoot

Write-Host "==> Building site with Hugo..." -ForegroundColor Cyan
hugo --minify
if ($LASTEXITCODE -ne 0) { throw "Hugo build failed." }

$WorktreeDir = Join-Path $RepoRoot '.deploy-worktree'

# Clean up any leftover worktree from a previous run.
if (Test-Path $WorktreeDir) {
    Write-Host "==> Removing stale worktree at $WorktreeDir" -ForegroundColor Yellow
    git worktree remove --force $WorktreeDir 2>$null
    if (Test-Path $WorktreeDir) { Remove-Item -Recurse -Force $WorktreeDir }
}

Write-Host "==> Creating worktree on deploy branch..." -ForegroundColor Cyan
git fetch origin deploy
git worktree add $WorktreeDir deploy
if ($LASTEXITCODE -ne 0) { throw "Failed to create deploy worktree." }

Write-Host "==> Replacing deploy branch contents with fresh build..." -ForegroundColor Cyan
Get-ChildItem -Path $WorktreeDir -Force |
    Where-Object { $_.Name -ne '.git' } |
    Remove-Item -Recurse -Force

Copy-Item -Path (Join-Path $RepoRoot 'public\*') -Destination $WorktreeDir -Recurse

Push-Location $WorktreeDir
try {
    git add -A
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "==> No changes to deploy. Already up to date." -ForegroundColor Green
        exit 0
    }

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
    $sourceSha = (git -C $RepoRoot rev-parse --short HEAD).Trim()
    git commit -m "Deploy site $timestamp (from $sourceSha)"
    if ($LASTEXITCODE -ne 0) { throw "Commit failed." }

    Write-Host "==> Pushing to origin/deploy..." -ForegroundColor Cyan
    git push origin deploy
    if ($LASTEXITCODE -ne 0) { throw "Push failed." }
}
finally {
    Pop-Location
    Write-Host "==> Cleaning up worktree..." -ForegroundColor Cyan
    git worktree remove --force $WorktreeDir
}

Write-Host "==> Done. Live site will refresh in ~1 minute: https://ldwgamedev.github.io/" -ForegroundColor Green
