# 🏠 Setting Up Universal System Locally

## 🎯 Goal
Get your newly committed universal infrastructure monitoring system running on localhost for testing before Vercel deployment.

---

## 📋 Prerequisites Check

Make sure you have:
- [ ] **Node.js 18+** or **Bun** installed
- [ ] **Git** installed and configured
- [ ] **GitHub Desktop** (which you already used)
- [ ] **PostgreSQL** database (local or hosted)

---

## 🚀 Step-by-Step Local Setup

### **Step 1: Clone/Pull Your Updated Repository**
```bash
# Navigate to where you want your project
cd /path/to/your/projects

# Clone your repository (if not already local)
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

# OR if you already have it locally, pull latest changes
git pull origin main
```

### **Step 2: Install Dependencies**
```bash
# Install all required packages
bun install

# Or if you prefer npm
npm install
```

### **Step 3: Set Up Environment Variables**
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use any text editor
```

**Configure your `.env` file:**
```bash
# Database URL - Use your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# JWT Secret - Generate a strong secret
JWT_SECRET="your-super-secure-secret-key-at-least-32-characters-long"

# Session Secret
SESSION_SECRET="your-session-secret-key"

# Google Maps API Key (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Step 4: Set Up Database**
```bash
# Generate Prisma client
bunx prisma generate

# Apply database migrations (creates all tables)
bunx prisma db push

# Optional: View your database
bunx prisma studio  # Opens database viewer in browser
```

### **Step 5: Start Development Server**
```bash
# Start the local development server
bun run dev

# Or with npm
npm run dev
```

You should see:
```
   ▲ Next.js 15.3.2
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000
 ✓ Ready in 2.3s
```

### **Step 6: Access Your Universal System**
1. **Open your browser** and go to: `http://localhost:3000`
2. **You should see the Setup Wizard** 🎉

---

## 🧙‍♂️ Complete the Setup Wizard

### **Organization Setup Example:**
```
Organization Name: Your Department Name
Organization Subtitle: Infrastructure Division
System Name: Infrastructure Monitoring System
Contact Domain: your-domain.gov (or .com)
Region: Your Region
Country: Your Country
```

### **Authentication Setup:**
- **Choose**: Local Database (easiest for testing)
- **Create Admin Account**:
  - Name: Your Name
  - Email: admin@your-domain.com
  - Password: Strong password (8+ characters)

### **Feature Configuration:**
- ✅ Enable GPS Tracking
- ✅ Enable Contractor Management
- ✅ Enable Financial Tracking
- ✅ Enable Reports & Analytics

### **Complete Setup:**
- Review your configuration
- Click "Complete Setup"
- **Success!** Your system is now configured

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] **Login successful** with your admin credentials
- [ ] **Dashboard loads** with your organization branding
- [ ] **No hardcoded PNG references** visible anywhere
- [ ] **Create a test project** works
- [ ] **Add GPS coordinates** works
- [ ] **User management** accessible (create test user)
- [ ] **System settings** show your organization details

---

## 🎨 Customization Test

Try changing your organization settings:
1. **Go to System Settings** (admin menu)
2. **Change organization name**
3. **Update colors/branding**
4. **Verify changes appear throughout system**

This proves the system is truly universal and configurable!

---

## 🚨 Troubleshooting

### **Database Connection Issues:**
```bash
# Check if PostgreSQL is running
pg_isready

# Reset database if needed
bunx prisma migrate reset
bunx prisma db push
```

### **Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 bun run dev
```

### **Dependencies Issues:**
```bash
# Clean install
rm -rf node_modules
rm bun.lock  # or package-lock.json
bun install
```

### **Setup Wizard Doesn't Appear:**
- Clear browser cache and cookies
- Check: `http://localhost:3000/api/system/setup-status`
- Should return: `{"requiresSetup": true}`

---

## 🌐 Ready for Vercel Deployment

Once your local system works perfectly:

### **Environment Variables for Vercel:**
```bash
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key
```

### **Deployment Options:**
1. **Connect GitHub repo** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** from main branch

---

## 🎉 Success Indicators

You'll know it's working when:
✅ **Setup wizard completes** without errors
✅ **Login works** with your credentials
✅ **Dashboard shows** your organization name
✅ **No PNG references** anywhere in the UI
✅ **All features work** (GPS, projects, users)
✅ **System is responsive** on different screen sizes

**You now have a universal infrastructure monitoring system running locally! 🚀**

---

## 🔄 Next Steps

1. **Test thoroughly** with different organization configurations
2. **Add real project data** to test functionality
3. **Configure Google Maps** API for full mapping features
4. **Set up production database** for Vercel deployment
5. **Deploy to Vercel** for public access

**Your system is ready for global deployment! 🌍**
