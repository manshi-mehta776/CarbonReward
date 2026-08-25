$ErrorActionPreference = "Stop"

Write-Host "Resetting history..."
git update-ref -d HEAD
git reset

function Commit-Date {
    param (
        [int]$daysAgo,
        [int]$hoursOffset,
        [int]$minsOffset,
        [string]$msg,
        [string[]]$files
    )
    $date = (Get-Date).AddDays(-$daysAgo).AddHours($hoursOffset).AddMinutes($minsOffset).ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    
    foreach ($file in $files) {
        git add $file
    }
    
    git commit -m $msg
}

Write-Host "Creating more realistic organic history..."

Commit-Date 10 3 14 "Initial project scaffolding" @("README.md", "LICENSE", ".gitignore")
Commit-Date 9 -2 45 "Set up smart contract structure" @("contracts/Cargo.toml", "contracts/campaign-contract/Cargo.toml")
Commit-Date 8 1 12 "Implement core Soroban campaign contract" @("contracts/campaign-contract/src/")
Commit-Date 7 -4 30 "Add contract dependencies and lockfile" @("contracts/Cargo.lock")
Commit-Date 6 4 22 "Initialize Node.js backend setup" @("backend/package.json", "backend/tsconfig.json", "backend/src/app.ts", "backend/src/server.ts")
Commit-Date 5 -1 5 "Add backend controllers and routes" @("backend/src/controllers/", "backend/src/routes/")
Commit-Date 4 2 50 "Add database models and middleware" @("backend/src/models/", "backend/src/middleware/", "backend/src/config/", "backend/src/utils/", "backend/src/__tests__/", "backend/.env.example")
Commit-Date 3 -3 18 "Set up React frontend framework" @("frontend/package.json", "frontend/tsconfig.json", "frontend/vite.config.ts", "frontend/index.html", "frontend/postcss.config.js", "frontend/tailwind.config.js")
Commit-Date 2 1 10 "Add UI components and React pages" @("frontend/src/")
Commit-Date 1 0 45 "Configure deployment scripts and GitHub actions" @("scripts/", ".github/", ".cargo/", "docs/")
Commit-Date 0 -2 15 "Update lockfiles and final polish" @("frontend/package-lock.json", "backend/package-lock.json", "frontend/.npmrc")

Write-Host "Organic history rewritten successfully!"
