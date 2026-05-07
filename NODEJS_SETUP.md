# Node.js Setup Guide

## Problem
`npm` command is not recognized, which means Node.js is not installed or not in your PATH.

## Solution: Install Node.js

### Option 1: Download from Official Website (Recommended)
1. Go to https://nodejs.org/
2. Download the **LTS (Long Term Support)** version (recommended for stability)
3. Run the installer
4. **Important**: Check the box "Add to PATH" during installation
5. Restart your terminal/PowerShell after installation

### Option 2: Using Chocolatey (if you have it)
```powershell
choco install nodejs-lts
```

### Option 3: Using Winget (Windows 10/11)
```powershell
winget install OpenJS.NodeJS.LTS
```

## Verify Installation

After installing, open a **new** PowerShell window and run:

```powershell
node --version
npm --version
```

You should see version numbers (e.g., `v20.10.0` and `10.2.3`).

## After Node.js is Installed

Once Node.js is installed, navigate to the web directory and install dependencies:

```powershell
# Navigate to project root first
cd C:\Users\user\woody

# Then go to web directory
cd apps\web

# Install dependencies
npm install
```

## Troubleshooting

### If npm still not found after installation:
1. Restart your terminal/PowerShell completely
2. Check if Node.js is in PATH:
   ```powershell
   $env:PATH -split ';' | Select-String node
   ```
3. If not found, manually add Node.js to PATH:
   - Usually located at: `C:\Program Files\nodejs\`
   - Add to System Environment Variables

### If you get permission errors:
Run PowerShell as Administrator and try again.
