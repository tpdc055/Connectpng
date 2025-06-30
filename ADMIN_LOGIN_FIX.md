# PNG Road Construction System - Admin Login Fix

## Problem
- System says "Admin already exists" but login fails with 401 error
- Need to fix admin user credentials for access

## Solution

### Quick Fix Options

1. **Visit the Admin Debug Page**: `https://tpdc-road-systems.vercel.app/admin-debug`
   - Lists all current admin users
   - Provides buttons to fix admin credentials
   - Shows results and credentials clearly

2. **Direct API Calls**:

#### List Current Admin Users
```
GET https://tpdc-road-systems.vercel.app/api/admin-manager?action=list
```

#### Reset ConnectPNG Admin Password
```
GET https://tpdc-road-systems.vercel.app/api/admin-manager?action=reset-admin
```
Returns: `admin@connectpng.com / Admin123!`

#### Force Recreate Admin (if reset fails)
```
GET https://tpdc-road-systems.vercel.app/api/admin-manager?action=force-recreate
```
Returns: `admin@connectpng.com / Admin123!`

#### Create Maria Pori Admin
```
GET https://tpdc-road-systems.vercel.app/api/admin-manager?action=create-mariapori-admin
```
Returns: `admin@mariapori.com / admin123`

## Expected Working Credentials

After running the fix, you should be able to login with:
- **Email**: `admin@connectpng.com`
- **Password**: `Admin123!`

OR

- **Email**: `admin@mariapori.com`
- **Password**: `admin123`

## Files Created/Modified

- `src/app/api/admin-manager/route.ts` - Admin management API
- `src/app/admin-debug/page.tsx` - Admin debug interface
- This README file

## How It Works

The admin manager:
1. Checks what admin users exist in the database
2. Can reset passwords using proper bcrypt hashing
3. Can force recreate users if needed
4. Ensures users are marked as active
5. Returns the working credentials

## Notes

- All password resets use proper bcrypt hashing (salt rounds: 10)
- Users are automatically set to active=true
- Original setup route only creates admin if none exist
- This solution works around that limitation
