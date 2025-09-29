# Design Guidelines: Corporate Wellness & Event Management Platform

## Design Approach: Material Design System

**Justification**: This utility-focused platform with information-dense dashboards, data visualization, and corporate context aligns perfectly with Material Design's principles of clear hierarchy, strong visual feedback, and content-rich experiences.

**Key Design Principles**:
- Clear information hierarchy for dashboard data
- Consistent interaction patterns across company and admin interfaces
- Visual feedback for task completion and approval workflows
- Professional aesthetic suitable for corporate environments

## Core Design Elements

### A. Color Palette

**Primary Colors**:
- Light Mode: 211 100% 50% (vibrant blue for trust and professionalism)
- Dark Mode: 211 80% 40% (muted blue for reduced eye strain)

**Secondary Colors**:
- Success: 142 76% 36% (for approvals, completed tasks)
- Warning: 38 92% 50% (for pending approvals)
- Error: 0 84% 60% (for rejections, errors)

**Neutral Colors**:
- Light Mode: Gray-50 to Gray-900 scale
- Dark Mode: Gray-100 to Gray-800 scale with proper contrast

### B. Typography

**Font Family**: Roboto (Material Design standard)
- Headlines: Roboto Medium, 24-32px
- Body text: Roboto Regular, 14-16px
- Captions/Labels: Roboto Medium, 12-14px
- Data displays: Roboto Mono, 14px (for statistics)

### C. Layout System

**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Micro spacing: p-2, m-2 (8px)
- Standard spacing: p-4, m-4 (16px) 
- Section spacing: p-6, m-6 (24px)
- Major spacing: p-8, m-8 (32px)

### D. Component Library

**Navigation**: 
- Top navigation bar with company logo/name
- Sidebar navigation for main sections
- Breadcrumb navigation for deep pages

**Dashboard Components**:
- Stat cards with large numbers and trend indicators
- Progress rings/bars for goals and completion
- Compact leaderboard tables with ranking badges

**Forms**:
- Material Design text fields with floating labels
- File upload areas with drag-and-drop support
- Multi-step forms for registration processes

**Data Displays**:
- Card-based layouts for tasks and company profiles
- Table views for admin management pages
- Modal overlays for proof approval workflows

**Feedback Elements**:
- Toast notifications for actions
- Loading states with Material spinners
- Success/error states with appropriate icons

### E. Animations

**Minimal Use Only**:
- Subtle fade-ins for dashboard stat updates
- Smooth transitions between approval states
- Loading animations for file uploads

## Page-Specific Considerations

**Company Dashboard**: Focus on clear data hierarchy with the most important metrics (Total Points, Today's Goal) prominently displayed using large typography and visual emphasis.

**Admin Interfaces**: Dense information layouts with efficient table views, quick action buttons, and clear filtering/search capabilities.

**Proof Approval**: Visual-first interface showcasing uploaded content with clear approve/reject actions and context about the submitting company.

**Event Management**: Clean form layouts for registration with progress indicators, and streamlined check-in interfaces optimized for mobile scanning.

The design should feel professional yet approachable, encouraging company participation while providing administrators with powerful, efficient tools for management and oversight.