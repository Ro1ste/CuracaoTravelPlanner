# Corporate Wellness & Event Management Platform

## 🎯 Project Overview

A comprehensive corporate wellness and event management platform built with Fullstack JavaScript stack. The platform supports dual authentication for companies and admins, task management with proof uploads, leaderboards, event registration with QR-based check-ins, and file upload capabilities.

## ✅ Current Status

**Infrastructure Complete:**
- ✅ PostgreSQL database with comprehensive schema
- ✅ Replit Auth integration
- ✅ Object Storage integration
- ✅ Material Design system with Roboto fonts
- ✅ Dark/light mode support
- ✅ Responsive layouts
- ✅ Dev Mode for testing without database

**Frontend Complete:**
- ✅ Landing page for non-authenticated users
- ✅ Company Dashboard with task management and leaderboards
- ✅ Admin Dashboard with company oversight and proof management
- ✅ Event Registration with QR code functionality
- ✅ Beautiful Material Design interface with animations
- ✅ Role-based routing and protected components
- ✅ Complete component library with examples
- ✅ Dev Mode login buttons for easy testing

**Backend Complete:**
- ✅ Full authentication with Replit Auth
- ✅ Database schema and storage interface
- ✅ Complete REST API with all CRUD operations
- ✅ In-memory storage mode for testing
- ✅ Dev Mode with role-based login

## 🛠 Technical Stack

**Frontend:**
- React with TypeScript
- Wouter for routing
- TanStack Query for state management
- Shadcn/ui components with Tailwind CSS
- Framer Motion for animations
- Material Design principles

**Backend:**
- Express.js with TypeScript
- Drizzle ORM with PostgreSQL
- Replit Auth (OpenID Connect)
- Passport.js for authentication
- Session management with connect-pg-simple

**Features:**
- Task management with proof submissions
- Company leaderboards and analytics
- Event registration and QR check-ins
- File upload capabilities (30MB limit)
- Admin dashboard for oversight
- Dark/light theme switching

## 🗂 Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── examples/              # Component examples
│   │   ├── AppSidebar.tsx         # Main navigation
│   │   ├── StatCard.tsx           # Statistics display
│   │   ├── TaskCard.tsx           # Task management
│   │   ├── LeaderboardCard.tsx    # Rankings display
│   │   ├── EventRegistrationForm.tsx
│   │   ├── QRCodeScanner.tsx      # QR code functionality
│   │   └── ThemeToggle.tsx        # Dark/light mode
│   ├── pages/
│   │   ├── Landing.tsx            # Authentication landing
│   │   ├── CompanyDashboard.tsx   # Company main page
│   │   ├── AdminDashboard.tsx     # Admin main page
│   │   └── EventRegistration.tsx  # Event management
│   ├── hooks/
│   │   └── useAuth.ts             # Authentication hook
│   └── App.tsx                    # Main application
├── server/
│   ├── storage.ts                 # Data storage interface
│   ├── routes.ts                  # API endpoints
│   ├── replitAuth.ts              # Authentication setup
│   └── index.ts                   # Server entry point
├── shared/
│   └── schema.ts                  # Database schema & types
└── package.json                   # Dependencies
```

## 📊 Database Schema

**Core Tables:**
- `users` - User authentication and profiles
- `companies` - Company registrations and stats
- `tasks` - Daily wellness tasks
- `task_proofs` - Proof submissions for review
- `events` - Event management
- `event_registrations` - Event attendee tracking
- `sessions` - Session storage for authentication

**Key Features:**
- UUID primary keys with automatic generation
- Comprehensive tracking of points, calories, team sizes
- Proof submission workflow with admin approval
- QR code generation for event check-ins
- Full audit trail with timestamps

## 🎨 Design System

**Theme:**
- Material Design principles
- Roboto font family (300, 400, 500, 700 weights)
- Professional corporate aesthetic
- Consistent spacing and elevation
- Dark/light mode support

**Colors:**
- Primary: Professional blue (#1976d2)
- Secondary: Accent orange (#ff9800)
- Success: Green (#4caf50)
- Warning: Amber (#ffc107)
- Error: Red (#f44336)

**Components:**
- Interactive hover animations
- Consistent elevation and shadows
- Responsive grid layouts
- Form validation and loading states

## 🧪 Dev Mode - Testing Without Database

**Dev Mode** allows you to test both the company and admin features without needing database setup or authentication. Perfect for quick testing and demonstrations!

### How to Enable Dev Mode:

1. **Add Environment Variables** in Replit Secrets:
   - `USE_DEV_STORAGE=true` - Enables in-memory storage
   - `VITE_DEV_MODE=true` - Shows dev login buttons on frontend
   
2. **Restart the Application** to apply changes

3. **Dev Login Buttons** will appear on the landing page:
   - "Login as Company" - Test the company dashboard
   - "Login as Admin" - Test the admin dashboard

### Dev Mode Features:

- ✅ **In-Memory Storage**: No database required - all data stored in memory
- ✅ **Sample Data**: Auto-seeds 3 wellness tasks on startup
- ✅ **Auto Company**: Creates a test company automatically for company users
- ✅ **Quick Role Switch**: Easily toggle between admin and company views
- ✅ **No Authentication**: Skip Replit Auth - instant access to features

### Dev Mode Limitations:

- ⚠️ **Data Resets**: All data is lost when server restarts
- ⚠️ **Single Session**: Dev mode uses a single admin and company user
- ⚠️ **No File Uploads**: Object storage requires real database

## 📱 How to Access

**Production Mode** (default):
1. **Preview URL:** Available in Replit workspace
2. **Login:** Click "Get Started" → `/api/login`
3. **Authentication:** Uses Replit Auth (Google, GitHub, email)
4. **Role Detection:** Admin users (email contains "admin") see admin dashboard
5. **Company Users:** See company dashboard with tasks and leaderboards

**Dev Mode** (testing):
1. Add `USE_DEV_STORAGE=true` and `VITE_DEV_MODE=true` to Replit Secrets
2. Restart application
3. Click "Login as Company" or "Login as Admin" on landing page
4. Instant access to all features with sample data

## 💾 Development Commands

```bash
# Start development server
npm run dev

# Database operations
npm run db:push          # Sync schema
npm run db:studio        # Open database GUI

# Package management
npm install <package>    # Add dependencies
```

## 📝 User Preferences

- **Design:** Material Design with professional corporate aesthetic
- **Authentication:** Replit Auth for simplicity and security
- **Database:** PostgreSQL for reliability and advanced features
- **Deployment:** Replit hosting for easy access and sharing

## 🔗 Access Information

**Primary Access:** This Replit project
**Backup Access:** All code is saved in this workspace
**Cross-Device:** Log into Replit account from any device to access

---

*Last Updated: September 29, 2025*
*Status: Frontend Complete, Backend Integration in Progress*