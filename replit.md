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

**Dev Mode is enabled by default in development!** This allows you to test both the company and admin features without needing database setup or authentication. Perfect for quick testing and demonstrations!

### How Dev Mode Works:

**Default Behavior:**
- In development (`NODE_ENV=development`), the app automatically uses MemStorage
- Dev login buttons appear on the landing page automatically
- Sample tasks are created on server startup
- No database or Replit Auth configuration needed

**To Disable Dev Mode (use real database in development):**
1. **Add to Replit Secrets:** `USE_DEV_STORAGE=false`
2. **Add to Replit Secrets:** `VITE_DEV_MODE=false` (optional, hides dev login buttons)
3. **Restart the Application**

**Dev Login:**
- "Login as Company" - Test the company dashboard with sample data
- "Login as Admin" - Test the admin dashboard with oversight features

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

### Technical Details:

**DEV_MODE Condition:**
```javascript
// Backend (server/storage.ts, server/replitAuth.ts)
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_DEV_STORAGE !== 'false';

// Frontend (client/src/pages/Landing.tsx)
const showDevButtons = import.meta.env.VITE_DEV_MODE !== 'false';
```

**Truth Table:**
| NODE_ENV | USE_DEV_STORAGE | Backend Mode | Dev Buttons |
|----------|-----------------|--------------|-------------|
| development | (unset) | MemStorage | Visible |
| development | false | DatabaseStorage | Hidden |
| production | (any) | DatabaseStorage | Hidden |

**Dev Endpoints:**
- `/api/dev/login?role=company` - Login as company user
- `/api/dev/login?role=admin` - Login as admin user
- Only registered when DEV_MODE is true (security safeguard)

**Environment Variables:**
- `NODE_ENV` - Set to 'development' by npm script
- `USE_DEV_STORAGE` - Controls storage backend (defaults to true in dev)
- `VITE_DEV_MODE` - Controls frontend dev buttons (defaults to true in dev)
- `SESSION_SECRET` - Required in production (fails fast if missing)

## 📱 How to Access

**Dev Mode** (default in development):
1. **Preview URL:** Available in Replit workspace
2. **Dev Login Buttons:** Automatically appear on landing page
3. Click "Login as Company" or "Login as Admin" to test features
4. **Sample Data:** 3 wellness tasks auto-created for testing
5. **Instant Access:** No authentication or database setup required

**Production Mode** (deployed app):
1. **Preview URL:** Available in Replit workspace
2. **Login:** Click "Get Started" → `/api/login`
3. **Authentication:** Uses Replit Auth (Google, GitHub, email)
4. **Role Detection:** Admin users (email contains "admin") see admin dashboard
5. **Company Users:** See company dashboard with tasks and leaderboards

**To Use Production Mode in Development:**
1. Set `USE_DEV_STORAGE=false` in Replit Secrets
2. Set `VITE_DEV_MODE=false` in Replit Secrets
3. Restart the application
4. Configure Replit Auth environment variables

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

*Last Updated: September 30, 2025*
*Status: Platform Complete - Ready for Testing and Deployment*