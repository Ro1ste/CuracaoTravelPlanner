# Corporate Wellness & Event Management Platform

## Overview
This platform is a comprehensive corporate wellness and event management solution. It enables businesses to manage employee well-being programs, streamline event coordination with features like QR-based check-ins, and facilitate real-time audience engagement through polling with AI-powered commentary. The system supports email/password authentication, task management with proof uploads, leaderboards, administrator management, and file uploads, providing a modern and intuitive user experience for fostering a healthy and engaged workforce.

## User Preferences
- **Design:** Material Design with professional corporate aesthetic
- **Authentication:** Replit Auth for simplicity and security
- **Database:** PostgreSQL for reliability and advanced features
- **Deployment:** Replit hosting for easy access and sharing

## System Architecture
The platform is built with a Fullstack JavaScript stack, using React with TypeScript for the frontend and Express.js with TypeScript for the backend.

**UI/UX Decisions:**
- Adheres to Material Design principles with a professional corporate aesthetic.
- Uses Roboto font family (300, 400, 500, 700 weights).
- Supports dark/light mode switching.
- Implements responsive layouts and interactive components with Framer Motion.
- Utilizes Shadcn/ui components with Tailwind CSS for a consistent design system.
- Polling system uses a black & white theme with CISW branding for professionalism.

**Technical Implementations:**
- **Frontend:** React with TypeScript, Wouter for routing, TanStack Query for state management.
- **Backend:** Express.js with TypeScript, Drizzle ORM with PostgreSQL.
- **Authentication:** Email/password authentication with bcrypt, Passport.js for session management, connect-pg-simple for session storage.
- **Features:**
    - Company signup/login.
    - Task management with proof submission, admin review, points, and calories tracking.
    - Company leaderboards displaying points and calories.
    - Event registration with shareable links, QR check-ins, and automated QR code email delivery.
    - Admin dashboard for company oversight, attendee approval, and event management.
    - Administrator management with email notifications for new admins.
    - File upload capabilities (30MB limit).
    - Role-based routing and protected components.
    - Real-time polling/voting system with subjects, polls, live results display, and AI commentary.
    - Dev Mode for quick testing with in-memory storage and sample data, allowing role switching without authentication.

**System Design Choices:**
- PostgreSQL database with a schema including `users`, `companies`, `tasks`, `task_proofs`, `events`, `event_registrations`, `sessions`, `subjects`, `polls`, and `votes` tables.
- UUID primary keys with automatic generation.
- Password hashing using bcrypt (10 rounds).
- Support for YouTube URL integration for tasks and events.
- Audit trails with timestamps for all core entities.
- Robust API with CRUD operations.
- WebSocket integration for real-time polling updates.
- Timezone handling for Curacao (AST, UTC-4) for consistent event scheduling.
- Location field for events.

## External Dependencies
- **Replit Auth:** For user authentication.
- **PostgreSQL:** Primary database.
- **Resend:** Email service for automated notifications (QR codes, event, admin welcomes).
- **Passport.js:** For session-based authentication.
- **connect-pg-simple:** For PostgreSQL-backed session storage.
- **bcrypt:** For password hashing.
- **TanStack Query:** For client-side data fetching and state management.
- **Shadcn/ui & Tailwind CSS:** For UI components and styling.
- **Framer Motion:** For animations.
- **WebSocket (ws):** For real-time polling vote updates.
- **OpenAI API:** For AI-powered commentary on live poll results (GPT-4o-mini).
- **Recharts:** For chart visualizations in the polling system.