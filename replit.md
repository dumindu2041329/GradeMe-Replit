# GradeMe - Exam Management System

## Overview

GradeMe is a comprehensive exam management system designed for educational institutions. It provides a modern React-based frontend with a Node.js/Express backend, utilizing Supabase for authentication and PostgreSQL for data storage. The application features separate interfaces for administrators and students, with real-time updates via WebSocket connections.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with glassmorphism design system
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: Wouter for lightweight client-side routing
- **3D Visualization**: Three.js for educational object displays

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle with PostgreSQL
- **Authentication**: Session-based auth with Supabase integration
- **Real-time**: WebSocket server for live updates
- **File Storage**: Supabase Storage for profile images and exam papers

### Database Design
- **Primary Database**: PostgreSQL hosted on Supabase
- **Schema Management**: Drizzle migrations
- **Tables**: users, students, exams, results
- **File Storage**: Supabase buckets for images and documents

## Key Components

### Authentication System
- Dual authentication paths for admin and student users
- Session-based authentication with Supabase integration
- Role-based access control (admin vs student)
- Password hashing with bcrypt

### Exam Management
- Paper creation with multiple question types (MCQ, written)
- File-based storage for exam papers using JSON format
- Real-time exam status tracking
- Automated scoring and result calculation

### Student Management
- Complete student profile management
- Guardian information tracking
- Class and enrollment management
- Academic performance analytics

### Results System
- Automated result calculation and storage
- Performance analytics and ranking
- Export functionality for reports
- Dashboard visualizations with charts

### File Storage
- Profile image uploads with validation
- Exam paper storage in JSON format
- Supabase Storage integration
- Image optimization and guidelines

## Data Flow

1. **Authentication Flow**: Users login through role-specific endpoints, session established in Express with Supabase verification
2. **Exam Creation**: Admin creates exams, questions stored in file system as JSON, metadata in PostgreSQL
3. **Student Exam Taking**: Students access available exams, submit answers, results calculated and stored
4. **Real-time Updates**: WebSocket connections broadcast exam status changes and new results
5. **Data Caching**: Client-side caching with TanStack Query, server-side optimizations for performance

## External Dependencies

### Core Infrastructure
- **Supabase**: Authentication, database hosting, file storage
- **PostgreSQL**: Primary database for structured data
- **Node.js**: Server runtime environment

### Frontend Libraries
- **React**: UI framework with hooks and context
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing solution
- **Three.js**: 3D graphics for educational visualizations
- **Radix UI**: Accessible component primitives

### Backend Libraries
- **Express**: Web framework for API routes
- **Drizzle**: Type-safe ORM for PostgreSQL
- **bcrypt**: Password hashing
- **WebSocket**: Real-time communication
- **Multer**: File upload handling

## Deployment Strategy

### Replit Configuration
- **Build Command**: `npm run build` - compiles both frontend and backend
- **Start Command**: `npm run start` - runs production server
- **Development**: `npm run dev` - runs development server with hot reload
- **Port Configuration**: Application runs on port 5000 with external port 80

### Environment Setup
- Database connection via Supabase PostgreSQL
- Environment variables for Supabase URL and keys
- Automatic database initialization with seed data
- File storage buckets created automatically

### Database Migrations
- Drizzle migrations for schema changes
- Automatic table creation on startup
- Seed data for admin and sample student accounts

## Changelog

- June 13, 2025. Initial setup
- June 13, 2025. Migrated from Replit Agent to Replit environment
- June 13, 2025. Removed Supabase storage dependency for question management - questions now managed frontend-only
- June 13, 2025. Added "Add Paper" button below questions section
- June 13, 2025. Enhanced paper creation with real-time question synchronization - automatic polling every 5 seconds, smart conflict resolution, visual sync indicators
- June 15, 2025. **Migration completed from Replit Agent to Replit environment**
- June 15, 2025. **Fixed question addition issue** - Questions now properly call API and refresh frontend
- June 15, 2025. **Fixed exam deletion errors** - Enhanced paper deletion to handle non-existent files gracefully
- June 15, 2025. **Improved error handling** - Better Supabase storage error management for missing paper files
- June 15, 2025. **Optimized question addition performance** - Implemented optimistic UI updates and streamlined backend processing
- June 15, 2025. **Removed automatic refresh timing** - Questions section now refreshes only on user actions, eliminating constant polling
- June 15, 2025. **Fixed question options bug** - Backend now properly handles options array format from frontend, ensuring multiple choice options are saved correctly
- June 15, 2025. **Fixed question deletion and update** - Both operations now properly call backend API to persist changes to Supabase storage
- June 15, 2025. **Removed Save Paper button** - Eliminated unnecessary manual save step as questions are automatically saved to storage
- June 15, 2025. **Migration completed from Replit Agent to Replit environment** - Successfully migrated project with all functionality intact
- June 15, 2025. **Fixed exam deletion bug** - Resolved 404 error issue where exams were being deleted successfully but returning incorrect status
- June 15, 2025. **Enhanced student authentication system** - Students now automatically get user accounts when created by admin, enabling proper login functionality
- June 15, 2025. **Added student-user synchronization** - Created migration system to ensure all students have corresponding user records for authentication
- June 17, 2025. **Migration to Replit environment completed** - Successfully migrated from Replit Agent with all functionality intact
- June 17, 2025. **Fixed authentication cross-validation** - Added proper role-based access control preventing students from using admin login and vice versa
- June 17, 2025. **Added profile image popup functionality** - Admin profile images are now clickable and display full-size popup with automatic circular cropping
- June 17, 2025. **Completed profile management system** - Fixed profile update functionality by adding missing API endpoints for user profile updates, student profile updates, notification settings, and password changes
- June 17, 2025. **Enhanced security** - Added proper password validation and bcrypt hashing for password changes with current password verification
- June 17, 2025. **Enforced exam status workflow** - New exams automatically have "upcoming" status, admin can only change status when editing existing exams
- June 17, 2025. **Protected completed exams** - Completed exams cannot be accessed or modified through paper creation page, with both frontend and backend access control
- June 17, 2025. **Added exam start and end time fields** - Enhanced exam table with start time and end time columns, updated database schema and UI forms
- June 17, 2025. **Implemented exam status protection** - Active exams cannot be changed back to upcoming status when students are taking them, with backend validation and frontend UI restrictions
- June 17, 2025. **Fixed completed exams statistics** - Landing page now displays actual count of completed exams from database instead of showing 0
- June 18, 2025. **Migration to Replit environment completed** - Successfully migrated from Replit Agent with all functionality intact
- June 18, 2025. **Removed End Time field** - Simplified exam form by removing End Time field from exam creation/editing interface
- June 18, 2025. **Improved Start Time picker** - Changed from date-time calendar to proper time-only input for better user experience
- June 18, 2025. **Enhanced time picker UI** - Created decorative time picker with popup interface, separate hour/minute dropdowns, and utility buttons
- June 18, 2025. **Improved cursor styling** - Updated text cursor and selection colors to match primary theme colors for consistent visual experience
- June 18, 2025. **Enhanced student form UI** - Added password reveal buttons with eye icons for better password visibility control and grade selection dropdown (Grade 1-13) for consistent class data entry
- June 18, 2025. **Fixed student creation errors** - Resolved database schema mismatch, added validation to prevent duplicate emails and name/email conflicts, improved error handling with specific user-friendly messages
- June 18, 2025. **Enhanced name/email validation** - Improved validation to prevent name from matching email address or email username part, ensuring true uniqueness between student names and email addresses
- June 18, 2025. **Improved error messaging system** - Enhanced user experience with specific error titles, clear descriptions, actionable guidance, and professional success messages across all student operations
- June 25, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact and dependencies properly installed
- June 25, 2025. **Fixed paper file renaming issue** - Added automatic paper file renaming in Supabase storage when exam names are changed, ensuring file names stay synchronized with exam names
- June 25, 2025. **Enhanced student dashboard with Active Exams section** - Added separate Active Exams section displaying only active exams with Start Exam buttons, while maintaining Upcoming Exams section for upcoming exams without start buttons

## User Preferences

Preferred communication style: Simple, everyday language.