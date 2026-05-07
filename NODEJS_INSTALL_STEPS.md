# Node.js Installation Steps

## ✅ You're on the Right Page!

The Node.js download page you're viewing is correct. Here's what to do:

## Recommended: Windows Installer (.msi)

1. **Click the green "Windows Installer (.msi)" button**
   - This is the easiest option
   - It will automatically:
     - Install Node.js
     - Add npm to your PATH
     - Set up everything you need

2. **Run the downloaded installer**
   - Accept the license agreement
   - Use default installation settings
   - **IMPORTANT**: Make sure "Add to PATH" is checked (it usually is by default)

3. **Restart your terminal/PowerShell**
   - Close your current PowerShell window
   - Open a new one
   - This ensures PATH changes take effect

4. **Verify installation**
   ```powershell
   node --version
   npm --version
   ```
   You should see version numbers like:
   - `v24.13.0` (or similar)
   - `11.6.2` (or similar)

## After Installation

Once Node.js is installed, install the frontend dependencies:

```powershell
cd C:\Users\user\woody\apps\web
npm install
```

This will:
- Install all React, Next.js, and TypeScript dependencies
- Fix the JSX type errors in `page.tsx`
- Set up everything needed for the frontend

## Alternative: Standalone Binary (.zip)

Only use this if you prefer manual setup:
- Download the .zip file
- Extract it
- Manually add to PATH (more complex)

**Recommendation: Use the .msi installer - it's much easier!**
