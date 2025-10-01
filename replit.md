# Corporate Wellness & Event Management Platform

## Overview
This project is a comprehensive corporate wellness and event management platform designed to facilitate employee well-being programs and streamline event coordination. It features email/password authentication for companies, task management with proof uploads, leaderboards, event registration with QR-based check-ins, and file upload capabilities. The platform aims to provide a robust solution for businesses to manage wellness initiatives and events efficiently, offering a modern and intuitive user experience.

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
- **Resend:** Email service for automated email delivery, including QR codes and event notifications.
- **Passport.js:** For session-based authentication.
- **connect-pg-simple:** For PostgreSQL-backed session storage.
- **bcrypt:** For password hashing.
- **TanStack Query:** For data fetching, caching, and state management on the client side.
- **Shadcn/ui & Tailwind CSS:** For UI components and styling.
- **Framer Motion:** For animations.