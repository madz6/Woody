# Quick Fix for npm in PowerShell

## The Problem
PowerShell is blocking `npm.ps1` due to execution policy, but Node.js is installed correctly.

## Quick Solutions

### Option 1: Use npm.cmd (Easiest)
Instead of `npm`, use `npm.cmd`:

```powershell
npm.cmd --version
npm.cmd install
```

### Option 2: Fix Execution Policy (Permanent Fix)
Run PowerShell **as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type `Y` to confirm. Then `npm` will work normally.

### Option 3: Use Command Prompt Instead
Open **Command Prompt (cmd)** instead of PowerShell:
- `npm` works directly in cmd
- No execution policy issues

## Install Frontend Dependencies

Once npm works, run:

```powershell
cd C:\Users\user\woody\apps\web
npm.cmd install
```

Or if you fixed execution policy:
```powershell
cd C:\Users\user\woody\apps\web
npm install
```

This will install all dependencies and fix the JSX errors in `page.tsx`.
