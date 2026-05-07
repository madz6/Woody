# Fix npm PowerShell Execution Policy Issue

## Problem
PowerShell is blocking npm because the execution policy doesn't allow unsigned scripts.

## Solution: Change Execution Policy

Run PowerShell **as Administrator** and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then type `Y` to confirm.

## Alternative: Use Command Prompt (cmd) Instead

If you prefer not to change execution policy, you can use Command Prompt (cmd) instead of PowerShell:

1. Open Command Prompt (not PowerShell)
2. Navigate to your project:
   ```
   cd C:\Users\user\woody\apps\web
   ```
3. Run npm commands - they should work in cmd:
   ```
   npm install
   ```

## Verify Node.js is in PATH

After restarting your terminal, verify:

**In PowerShell:**
```powershell
$env:PATH -split ';' | Select-String nodejs
```

**In Command Prompt:**
```cmd
echo %PATH% | findstr nodejs
```

You should see `C:\Program Files\nodejs` in the output.

## If Node.js Still Not Found

1. **Restart your terminal completely** (close and reopen)
2. If still not working, manually add to PATH:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to "Advanced" tab → "Environment Variables"
   - Under "System variables", find "Path" → Edit
   - Add: `C:\Program Files\nodejs`
   - Click OK on all dialogs
   - Restart terminal

## Quick Test After Fix

```powershell
node --version
npm --version
```

Both should show version numbers without errors.
