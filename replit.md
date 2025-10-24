# Corporate Wellness & Event Management Platform

## Overview
This project is a comprehensive corporate wellness and event management platform designed to facilitate employee well-being programs and streamline event coordination. It features email/password authentication for companies, task management with proof uploads, leaderboards, event registration with QR-based check-ins, administrator management with email notifications, and file upload capabilities. The platform aims to provide a robust solution for businesses to manage wellness initiatives and events efficiently, offering a modern and intuitive user experience.

## User Preferences
- **Design:** Material Design with professional corporate aesthetic
- **Authentication:** Replit Auth for simplicity and security
- **Database:** PostgreSQL for reliability and advanced features
- **Deployment:** Replit hosting for easy access and sharing

## System Architecture
The platform is built with a Fullstack JavaScript stack, utilizing React with TypeScript for the frontend and Express.js with TypeScript for the backend.

**UI/UX Decisions:**
- Adheres to Material Design principles with a professional corporate aesthetic.
- Uses Roboto font family (300, 400, 500, 700 weights).
- Supports dark/light mode switching.
- Implements responsive layouts and interactive components with Framer Motion for animations.
- Utilizes Shadcn/ui components with Tailwind CSS for a consistent design system.

**Technical Implementations:**
- **Frontend:** React with TypeScript, Wouter for routing, TanStack Query for state management.
- **Backend:** Express.js with TypeScript, Drizzle ORM with PostgreSQL.
- **Authentication:** Email/password authentication with bcrypt hashing, Passport.js for session management, connect-pg-simple for session storage.
- **Features:**
    - Company signup and login with email/password.
    - Task management with proof submission and admin review.
    - Company leaderboards and analytics.
    - Event registration with shareable links and QR check-ins.
    - Admin dashboard for company oversight, attendee approval workflow, and event management.
    - Administrator management - create admin accounts with automated email notifications.
    - Automated QR code email delivery and customizable email templates per event.
    - File upload capabilities (30MB limit).
    - Role-based routing and protected components.
    - Dev Mode for quick testing with in-memory storage and sample data, allowing quick role switching without authentication.

**System Design Choices:**
- PostgreSQL database with a comprehensive schema including `users`, `companies`, `tasks`, `task_proofs`, `events`, `event_registrations`, and `sessions` tables.
- UUID primary keys with automatic generation.
- Password hashing using bcrypt (10 rounds).
- Support for YouTube URL integration for tasks and events.
- Audit trails with timestamps for all core entities.
- Robust API with all CRUD operations.

## External Dependencies
- **Replit Auth:** For user authentication integration.
- **PostgreSQL:** Primary database for persistent storage.
- **Resend:** Email service for automated email delivery, including QR codes, event notifications, and admin welcome emails.
- **Passport.js:** For session-based authentication.
- **connect-pg-simple:** For PostgreSQL-backed session storage.
- **bcrypt:** For password hashing.
- **TanStack Query:** For data fetching, caching, and state management on the client side.
- **Shadcn/ui & Tailwind CSS:** For UI components and styling.
- **Framer Motion:** For animations.

## Recent Changes (October 1, 2025)

**Admin Task Management & Calories Tracking System (October 1, 2025):**
- ✅ Created comprehensive TasksManagement page at `/tasks` for admin users
- ✅ Admin can create tasks with title, description, date, YouTube video URL, points reward, and calories burned
- ✅ Full CRUD operations: Create, edit, and delete tasks with form validation
- ✅ Implemented calories tracking system throughout the platform
- ✅ Storage methods: `updateCompanyCalories()` added to IStorage interface and both storage implementations
- ✅ SQL safety: COALESCE used in DatabaseStorage to handle NULL values in point/calorie arithmetic
- ✅ Proof approval now awards BOTH points AND calories to companies
- ✅ Leaderboard API endpoint (GET `/api/leaderboard`) returns company rankings with points and calories
- ✅ Company portal redesigned with vibrant, colorful Material Design layout
- ✅ Stat cards display total points, calories burned, tasks completed, and current rank with gradient backgrounds
- ✅ Task cards feature category-based colors, YouTube video thumbnails, and "Watch Tutorial" CTAs
- ✅ Leaderboard page shows company rankings with both points and calories burned
- ✅ Settings page allows companies to edit their profile information
- ✅ Design guidelines updated with vibrant wellness theme: green-teal wellness gradients, orange energy accents, blue-purple achievement colors
- ✅ Security fix: YouTube video links use window.open with explicit opener null to prevent tabnabbing

**Task Creation & Management Workflow:**
1. Admin navigates to Tasks Management page from sidebar
2. Clicks "Create Task" button to open dialog
3. Fills form with task details including YouTube URL, points (1-100), and calories (1-1000)
4. Task is created and displayed in task list
5. Admin can edit or delete tasks as needed
6. Companies see tasks on their dashboard and can submit proofs

**Calories Tracking Flow:**
1. Admin creates task with calories burned value
2. Company completes task and submits proof
3. Admin reviews proof and approves it
4. System awards BOTH points and calories to company
5. Company's totalPoints and totalCaloriesBurned are incremented
6. Dashboard displays updated totals with colorful stat cards
7. Leaderboard shows rankings with both metrics

**Technical Implementation:**
- Storage methods: `updateCompanyCalories()` with COALESCE for NULL-safe SQL arithmetic
- API endpoints: POST `/api/tasks`, PATCH `/api/tasks/:id`, DELETE `/api/tasks/:id`, GET `/api/leaderboard`
- Proof review: PATCH `/api/proofs/:id/review` awards points and calories on status transition to approved
- Frontend: TasksManagement page with React Query mutations, Zod validation, shadcn/ui components
- UI components: StatCard with gradient overlays, TaskCard with clickable video thumbnails
- Security: Window.open with noopener and explicit opener null for YouTube links

**Email Domain Update (October 1, 2025):**
- ✅ Updated email sender address from info@curacaointernationalsportsweek.com to info@bepartofthemovement.com
- ✅ All automated emails (QR codes, event notifications, admin welcome emails) now send from bepartofthemovement.com
- ⚠️ Requires domain verification in Resend dashboard with SPF/DKIM/DMARC records

**Event Email Improvements (October 24, 2025):**
- ✅ Added proper line spacing in email body - each line wrapped in `<p>` with 8px vertical margin
- ✅ Removed QR code usage instructions from emails (no more "How to use your QR Code" section)
- ✅ Simplified QR code email display - shows only the title "Your Event QR Code" and the QR image
- ✅ Improved HTML formatting - converts plain text to properly spaced HTML paragraphs

**Admin Login Configuration (October 1, 2025):**
- ✅ Created production admin account: admin@curacaointernationalsportsweek.com (password: Admin2024!)
- ✅ Admin account stored in production database with bcrypt hashing (10 rounds)
- ℹ️ Dev environment uses MemStorage - admin account only works on published site
- ℹ️ For local testing, use dev login feature: admin@dev.local (no password required)

**Administrator Management System:**
- ✅ Created Administrators Management page at `/administrators` for admin users
- ✅ Implemented API endpoints for listing and creating admin accounts
- ✅ Added secure admin creation with bcrypt password hashing (10 rounds)
- ✅ Built email notification system for new administrators
- ✅ Welcome emails sent with login credentials to new admins
- ✅ Form validation with double-entry password confirmation (min 8 characters)
- ✅ Added "Administrators" link to admin sidebar navigation with ShieldCheck icon
- ✅ Admin table displays name, email, and creation date
- ✅ Graceful email failure handling - admin creation succeeds even if email fails
- ✅ Security: Password fields filtered from API responses

**Administrator Creation Workflow:**
1. Admin clicks "Administrators" in sidebar
2. Clicks "Create Administrator" button
3. Fills form with first name, last name, email, and temporary password
4. System validates email uniqueness and password requirements
5. Password is hashed with bcrypt (10 rounds)
6. Admin user is created in database with isAdmin=true
7. Welcome email is sent with login credentials
8. Admin appears in administrators table
9. New admin can log in with provided credentials

**Technical Implementation:**
- Storage methods: `getAllAdmins()` and `createAdmin()` in both DatabaseStorage and MemStorage
- API endpoints: GET `/api/admin/admins` and POST `/api/admin/admins` (both admin-only)
- Email service: `sendAdminWelcomeEmail()` method with HTML/text templates
- Frontend: React Query for data fetching, Zod for form validation, shadcn/ui components
- Security: isAuthenticated + isAdmin middleware, password field sanitization
- Dev mode compatible: Works with in-memory storage, tolerates email failures

**Database Setup (October 1, 2025):**
- ✅ Database schema synchronized with `npm run db:push`
- ✅ Column renamed: tasks.video_url → tasks.youtube_url
- ✅ All tables created: users, companies, tasks, task_proofs, events, event_registrations, sessions
- ✅ Production-ready database configuration

**Development Environment Update (October 1, 2025):**
- ✅ Switched development to use real PostgreSQL database by default (DatabaseStorage)
- ✅ Data now persists in development environment
- ✅ Admin login works in local development with database credentials
- ✅ Fixed critical security issue: password hashes no longer exposed in API responses
- ✅ Session storage uses PostgreSQL in development
- ℹ️ To use in-memory storage for testing, set `USE_DEV_STORAGE=true` environment variable

## Deployment Notes

**Environment Modes:**
- **Development** (`NODE_ENV=development`): Uses DatabaseStorage (PostgreSQL) by default for data persistence
- **Production** (`NODE_ENV=production`): Uses DatabaseStorage (PostgreSQL), serves pre-built static assets
- **Testing** (set `USE_DEV_STORAGE=true`): Uses MemStorage (in-memory) with sample seed data

**Required Environment Variables for Production:**
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `SESSION_SECRET` - Secret key for session encryption (auto-provided by Replit)
- `RESEND_API_KEY` - Email service API key (auto-provided by Replit)
- `PUBLIC_OBJECT_SEARCH_PATHS` - Object storage public paths (auto-provided by Replit)
- `PRIVATE_OBJECT_DIR` - Object storage private directory (auto-provided by Replit)

**Deployment Process:**
1. Build: `npm run build` - Compiles client to `dist/public` and server to `dist/index.js`
2. Run: `npm run start` - Starts production server with `node dist/index.js`
3. Database: Ensure `npm run db:push` has been run to create all tables

**Production Checklist:**
- ✅ Database tables created via `npm run db:push`
- ✅ All environment variables configured in deployment settings
- ✅ Build completed successfully (`dist/public` contains static assets)
- ✅ Production server serves from `dist/public` directory