# Corporate Wellness & Event Management Platform

## 🎯 Project Overview

A comprehensive corporate wellness and event management platform built with Fullstack JavaScript stack. The platform supports dual authentication for companies and admins, task management with proof uploads, leaderboards, event registration with QR-based check-ins, and file upload capabilities.

## ✅ Current Status

**Infrastructure Complete:**
- ✅ PostgreSQL database with comprehensive schema
- ✅ Replit Auth integration (needs minor fixes)
- ✅ Object Storage integration
- ✅ Material Design system with Roboto fonts
- ✅ Dark/light mode support
- ✅ Responsive layouts

**Frontend Complete:**
- ✅ Landing page for non-authenticated users
- ✅ Company Dashboard with task management and leaderboards
- ✅ Admin Dashboard with company oversight and proof management
- ✅ Event Registration with QR code functionality
- ✅ Beautiful Material Design interface with animations
- ✅ Role-based routing and protected components
- ✅ Complete component library with examples

**Backend In Progress:**
- ⚠️ Authentication routes need environment setup
- ✅ Database schema and storage interface
- ✅ API structure defined

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

## 🔧 Current Issues to Fix

1. **Authentication Setup:**
   - Environment variables need configuration
   - Replit Auth integration needs completion
   - Session storage requires database connection

2. **Minor Fixes:**
   - Import path resolution in server files
   - TypeScript type definitions
   - Route handler type safety

## 🚀 Next Steps

1. **Fix Authentication:**
   - Complete Replit Auth setup
   - Test login/logout flow
   - Verify user session management

2. **Backend API Development:**
   - Implement CRUD operations for all entities
   - Add file upload endpoints
   - Create QR code generation
   - Build leaderboard calculations

3. **Advanced Features:**
   - Real-time notifications
   - Analytics dashboard
   - Bulk operations for admins
   - Advanced filtering and search

## 📱 How to Access

1. **Preview URL:** Available in Replit workspace
2. **Login:** Click "Get Started" → `/api/login`
3. **Authentication:** Uses Replit Auth (Google, GitHub, email)
4. **Role Detection:** Admin users (email contains "admin") see admin dashboard
5. **Company Users:** See company dashboard with tasks and leaderboards

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