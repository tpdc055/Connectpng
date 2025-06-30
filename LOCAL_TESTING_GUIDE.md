# 🧪 Local Testing Guide - Universal Infrastructure Monitoring System

## 🚀 Quick Start
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Visit: http://localhost:3000
```

## ✅ System Verification Checklist

### 1. Setup Wizard Test
- [ ] **First Visit**: Setup wizard appears on first access
- [ ] **Organization Setup**: Configure custom organization details
- [ ] **Authentication**: Choose and configure auth method
- [ ] **Admin Creation**: Create initial administrator account
- [ ] **Feature Toggle**: Enable/disable system features
- [ ] **Completion**: Setup wizard completes successfully

### 2. Universal Configuration Test
- [ ] **No Hardcoded Values**: Zero organization-specific references
- [ ] **Dynamic Branding**: Custom organization name appears everywhere
- [ ] **Email Domains**: Custom contact domain used in placeholders
- [ ] **Regional Settings**: Custom region/country display
- [ ] **Currency**: Configurable currency and formatting

### 3. Core Functionality Test
- [ ] **Authentication**: Login with setup wizard credentials
- [ ] **Dashboard**: Access main dashboard with custom branding
- [ ] **GPS Tracking**: Add GPS coordinates
- [ ] **Project Management**: Create/view projects
- [ ] **User Management**: Admin functions work
- [ ] **File Upload**: Photo/spreadsheet uploads
- [ ] **Maps Integration**: Google Maps loading (if API key set)

### 4. Multi-Organization Test
- [ ] **Different Configs**: Test multiple organization setups
- [ ] **Auth Methods**: Test different authentication types
- [ ] **Role Systems**: Custom roles and permissions
- [ ] **Access Control**: Project/section-level restrictions

## 🔑 Setup Wizard Testing
Instead of hardcoded credentials, you'll create your own through the setup wizard:

1. **Organization Example**: "US Department of Transportation"
2. **System Name**: "Highway Infrastructure Monitor"
3. **Admin Email**: "admin@dot.gov"
4. **Admin Password**: Your choice (8+ characters)
5. **Contact Domain**: "dot.gov"

## 🌍 Universal Customization Test

### Change Organization Settings
1. Open browser DevTools → Console
2. Run this to test different organization:
```javascript
// Test US Infrastructure Department
localStorage.setItem('systemSettings', JSON.stringify({
  organizationName: 'US Department of Transportation',
  organizationSubtitle: 'Highway Infrastructure Division',
  systemName: 'Highway Monitoring System',
  contactDomain: 'dot.gov',
  region: 'California Region',
  country: 'United States'
}));
location.reload();
```

3. Verify the system adapts to new organization settings

### Test UK Configuration
```javascript
// Test UK Highways Agency
localStorage.setItem('systemSettings', JSON.stringify({
  organizationName: 'UK Highways Agency',
  organizationSubtitle: 'Road Infrastructure Division',
  systemName: 'Road Infrastructure Monitor',
  contactDomain: 'highways.gov.uk',
  region: 'South West Region',
  country: 'United Kingdom'
}));
location.reload();
```

## 🔍 Database Test Commands
```bash
# Check database status
bunx prisma db push

# View database in browser
bunx prisma studio

# Reset to defaults (if needed)
bunx prisma migrate reset
```

## 🐛 Troubleshooting

### Development Server Issues
```bash
# Kill existing processes
pkill -f "next dev"

# Restart clean
bun run dev
```

### Database Connection Issues
```bash
# Regenerate Prisma client
bunx prisma generate

# Sync database
bunx prisma db push
```

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun run dev
```

## ✅ Success Criteria

Your local system is ready when:
- ✅ No PNG/ITCFA hardcoded text visible anywhere
- ✅ All organization names are generic/configurable
- ✅ Login and core features work properly
- ✅ Different organization settings can be applied
- ✅ System adapts properly to configuration changes

## 🚀 Next Steps After Local Testing
1. **Package for deployment** (zip project files)
2. **Set up production environment variables**
3. **Deploy to production platform** (Vercel/Netlify)
4. **Configure production database**
5. **Set up Google Maps API for production**

---
**This system is now universally compatible and ready for deployment worldwide! 🌍**
