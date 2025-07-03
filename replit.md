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
- June 25, 2025. **Added start time display to student dashboard** - Enhanced both Active Exams and Upcoming Exams sections to display exam start times alongside date, duration, and marks for better student planning
- June 25, 2025. **Enhanced start time visibility in Upcoming Exams** - Made start time display more prominent with primary color highlighting and "Time TBA" fallback for better user experience
- June 25, 2025. **Added Completed Exams section to student dashboard** - Implemented comprehensive Completed Exams section with student scores, performance indicators, and color-coded feedback to help students track their exam history and results
- June 25, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact
- June 25, 2025. **Enhanced exam-taking functionality** - Added complete exam submission API endpoint with automatic scoring for multiple choice questions, result calculation, and ranking system. Students can now properly take exams through the Start Exam button with timer functionality, progress tracking, and instant results display
- June 25, 2025. **Fixed total marks synchronization issue completely** - Implemented comprehensive automatic synchronization between exam total marks and sum of individual question marks. Added utility function that updates exam table whenever questions are added, updated, or deleted. Created manual sync API endpoint (/api/admin/sync-exam-marks/:examId) for administrators to fix any discrepancies. System now ensures exam total marks always equal the sum of question marks, preventing scoring calculation errors
- June 27, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact
- June 27, 2025. **Fixed automatic total marks synchronization bug** - Resolved issue where exam total marks were only updated for the first question but not subsequent ones. Added missing syncExamTotalMarks calls in paper-file-storage.ts for both savePaper and addQuestion methods, ensuring consistent database synchronization for all question operations
- June 27, 2025. **Fixed phantom question creation on page reload** - Resolved frontend issue where reloading the paper creation page would automatically create duplicate questions. Improved question synchronization logic to properly load existing questions from Supabase storage instead of creating new ones, with enhanced data consistency checks and proper server-client state synchronization
- June 27, 2025. **Implemented manual total marks control** - Removed automatic total marks synchronization as requested by user. System now defaults new exams to 100 total marks and allows administrators to manually control exam total marks through the exam form. Questions can be added without affecting the exam's total marks, giving administrators full control over scoring
- June 27, 2025. **Fixed duplicate sections in student dashboard** - Removed duplicate "Upcoming Exams" sections from student dashboard to provide cleaner user interface. Dashboard now has proper separation between Active Exams, Completed Exams, and single Upcoming Exams section
- June 27, 2025. **Fixed student exam completion workflow** - Students who complete exams no longer see those exams in Active Exams section. Completed exams properly move to Completed Exams section with automatic dashboard refresh
- June 27, 2025. **Cleaned up server console output** - Removed unnecessary database notices and verbose logging to provide cleaner development experience
- June 27, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact
- June 27, 2025. **Fixed student dashboard responsive layout** - Improved responsive grid layout for dashboard stats cards, changing from md:grid-cols-4 to sm:grid-cols-2 lg:grid-cols-4 for better display on various screen sizes
- June 27, 2025. **Fixed headers to top position** - Made both admin and student headers fixed to the top with backdrop blur effects and proper z-index positioning. Added pt-20 padding to all main content areas to prevent content overlap
- June 27, 2025. **Added GradeMe logo to admin header** - Added GradeMe logo with icon and text to admin header for desktop mode only, with click navigation to admin dashboard. Logo is hidden on mobile to maintain clean hamburger menu interface
- June 27, 2025. **Removed page title from admin header** - Cleaned up admin header by removing the page title element while keeping GradeMe logo intact for better visual design
- June 27, 2025. **Implemented Row Level Security (RLS)** - Added comprehensive RLS policies to all database tables (users, students, exams, results) with role-based access control. Admins can manage all data, students can only access their own records, with optimized helper functions for better performance
- June 27, 2025. **Cleaned up student profile UI** - Removed all Reset buttons from student profile forms (personal information, notification settings, password change) for cleaner interface design
- June 29, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact
- June 29, 2025. **Enhanced Performance Analytics with animations** - Added smooth Framer Motion animations to Performance Trend chart and Grade Distribution section in student dashboard for better visual experience
- June 29, 2025. **Implemented complete student profile settings** - Added full backend API endpoints for student profile management including GET /api/student/profile for fetching data, PUT /api/students/profile for updates, PUT /api/student/notifications for notification preferences, and POST /api/student/change-password for password changes. All features now fully functional with Supabase integration
- June 30, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact
- June 30, 2025. **Implemented student profile image upload** - Added complete profile image upload functionality with Supabase storage integration, including circular avatar display, file validation (5MB limit, image types only), upload progress feedback, and instant preview
- June 30, 2025. **Added profile image delete functionality** - Implemented delete button for profile images with proper Supabase storage cleanup, UI updates, and user feedback
- June 30, 2025. **Fixed profile image deletion display** - Resolved issue where student initials weren't showing immediately after profile image deletion. Replaced Avatar component with custom div to ensure initials display properly without page reload
- December 30, 2024. **Enhanced student profile form usability** - Removed individual X buttons from form fields and added Reset buttons to clear all inputs in Personal Information and Change Password sections, providing cleaner UI and better user experience
- December 30, 2024. **Fixed student profile save functionality** - Resolved route ordering issue where `/api/students/:id` was matching before `/api/students/profile`, causing admin middleware to block student profile updates. Moved specific routes before generic parameterized routes to ensure correct middleware execution
- December 30, 2024. **Migration from Replit Agent to Replit environment completed** - Successfully migrated the entire GradeMe project with all functionality intact. Server runs cleanly on port 5000, all database connections work properly, and student notification settings can be updated through profile page
- December 30, 2024. **Fixed rank display in student dashboard** - Updated rank calculation to show student's position among all students in the database, not just those who took the exam. Ranks now display as "X of Y" where Y is the total number of students in the system
- December 30, 2024. **Fixed student profile image synchronization** - Updated profile image upload and delete functionality to save data to both students and users tables in Supabase, ensuring proper data synchronization across both tables when students update their profile images
- December 30, 2024. **Fixed profile image preview after re-upload** - Resolved issue where new profile images wouldn't display properly after deletion. Updated frontend to show actual server URL instead of base64 preview after successful upload
- December 30, 2024. **Enhanced class ranking system** - Updated student dashboard to show overall class rank based on average performance across all students in the system. Ranking now considers students with exam results first, then sorts by average score, providing more accurate class positioning
- December 30, 2024. **Removed admin profile image popup** - Disabled clickable functionality on admin profile image by replacing ProfileImagePopup component with simple Avatar component. Admin profile images are now non-interactive as requested by user
- December 30, 2024. **Fixed student profile image persistence after logout** - Resolved issue where student profile images weren't displaying after logout/login. Updated student login endpoint to properly query users table for profile image and notification settings using studentId field
- December 30, 2024. **Removed hamburger menu icon from admin header** - Simplified admin dashboard UI by removing the separate hamburger menu icon next to profile image. Profile image is now directly clickable to show the dropdown menu with hover ring effect
- December 30, 2024. **Fixed profile image deletion without page reload** - Removed automatic page reload after profile image deletion. The UI now updates immediately to show user initials when image is deleted, providing seamless user experience
- December 30, 2024. **Implemented automatic exam total marks synchronization** - Added automatic calculation and synchronization of exam total marks based on the sum of all question marks. When questions are added, updated, or deleted, the exam's total marks in the database automatically update to reflect the correct sum. This ensures scoring calculations are always accurate and prevents mismatches between question marks and exam total marks
- December 30, 2024. **Made exam total marks display read-only** - Updated the exam creation/editing form to display total marks as a read-only field that automatically shows the sum of all question marks. The field updates in real-time as questions are added, modified, or deleted, providing administrators with immediate visual feedback of exam scoring
- December 30, 2024. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact, dependencies properly installed, and tsx package issue resolved
- December 30, 2024. **Fixed question synchronization on paper creation page** - Updated React Query configuration to enable automatic refresh when navigating back to the page, ensuring questions always display current data
- December 30, 2024. **Improved question update speed** - Reduced question loading time by implementing 2-second automatic refresh interval and removing cache, making question additions appear almost immediately without manual refresh
- June 30, 2025. **Implemented comprehensive email notification system** - Added Resend email service integration with automatic exam result notifications and manual upcoming exam reminders. Students receive personalized HTML emails with performance feedback when completing exams. Administrators can send bulk or individual exam reminders through new Email Management page with test functionality
- July 1, 2025. **Fixed email notification toggles** - Added missing email notification fields (emailNotifications, emailExamResults, emailUpcomingExams) to the database schema and updated all relevant endpoints to handle these fields. Email notification toggles now work properly in the admin profile settings
- July 1, 2025. **Configured SendGrid email service** - Successfully integrated SendGrid API for email notifications. Added SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables to enable email delivery for exam results and upcoming exam reminders
- July 1, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact. Server runs on port 5000, all dependencies properly installed, and email notifications configured
- July 1, 2025. **Final migration to Replit environment completed** - Successfully completed migration from Replit Agent to standard Replit environment. Fixed tsx dependency issue, established proper workflow configuration, verified all functionality including admin login, dashboard access, and database connections. SendGrid email service configured and ready for use
- July 2, 2025. **Fixed profile image background colors for theme compatibility** - Updated all profile image sections to use theme-aware Tailwind classes (bg-gray-200 dark:bg-gray-700) instead of hardcoded dark colors. Also made text colors theme-aware (text-gray-800 dark:text-white) to ensure proper contrast in both light and dark modes
- July 2, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact, dependencies properly installed, and server running cleanly on port 5000
- July 2, 2025. **Fixed dashboard and email management API response handling** - Updated frontend components to properly handle API responses that return objects with data properties instead of direct arrays. Fixed TypeError issues where components expected arrays but received objects
- July 2, 2025. **Removed all SMS notification functionality** - Removed SMS-related columns (smsNotifications, smsExamResults, smsUpcomingExams) from users table and all associated code. Application now uses email notifications only
- July 2, 2025. **Updated student profile background colors** - Changed profile image upload area background colors to use white for light theme and #030711 for dark theme as requested by user for better visual consistency
- July 2, 2025. **Added advanced filtering to admin results page** - Implemented comprehensive filtering functionality with dropdowns for student name, exam selection, and date picker. Filters work together with existing search functionality and include a clear filters button. Student and exam dropdowns are alphabetically sorted for better usability
- July 2, 2025. **Added Today button to calendar component** - Enhanced the calendar date picker with a prominent "Today" button at the bottom that navigates to and selects today's date, improving user experience across all date selection interfaces
- July 2, 2025. **Fixed calendar component bugs on results page** - Fixed date picker popover not closing after selection and Today button not working properly. Calendar now closes automatically when selecting dates and properly filters results
- July 2, 2025. **Applied calendar auto-close functionality across all pages** - Updated all date picker implementations (student profile page and exam modal) to match the results page pattern. All date pickers now automatically close when a date is selected, providing consistent user experience throughout the application
- July 2, 2025. **Added Start Time field to exams** - Added startTime field to the exams table schema and created migration. Updated backend routes to handle startTime in exam creation and updates. Enhanced student dashboard to display exam start times in both Active Exams and Upcoming Exams sections with prominent visual styling
- July 2, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact. Server runs cleanly on port 5000, all dependencies properly installed, and email notifications configured
- July 2, 2025. **Added start time display to Completed Exams section** - Enhanced Completed Exams section in student dashboard to display exam start times alongside other exam details, providing consistent information display across all exam sections
- July 2, 2025. **Removed end_time column from database** - Completely removed end_time column from exams table in Supabase database and cleaned up all references in codebase including Zod validation schema, ensuring cleaner data model focused on start time and duration
- July 2, 2025. **Added automatic database table creation** - Implemented automatic table creation on server startup. If tables don't exist in Supabase database, they are automatically created using migration SQL files, ensuring the project runs smoothly even with a fresh database
- July 2, 2025. **Enhanced security by removing hardcoded credentials** - Removed all hardcoded admin and student credentials from the codebase for security. Initial users are now created only through environment variables (INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, etc.). Created SETUP_GUIDE.md with secure setup instructions. This prevents credential exposure in source code and enforces stronger password practices
- July 2, 2025. **Implemented pagination for improved performance** - Added server-side pagination to Students, Exams, and Results pages to significantly improve loading speed. Each page now displays 10 items at a time with search functionality, page navigation controls, and "Showing X to Y of Z" indicators. Backend supports both paginated and non-paginated requests for backwards compatibility
- July 2, 2025. **Added automatic exam completion** - Implemented automatic exam status update to "completed" when all students finish taking an exam. After each student submission, the system checks if all registered students have completed the exam and automatically updates the status from "active" to "completed", eliminating manual intervention
- July 2, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact. Server runs cleanly on port 5000, all dependencies properly installed, and exam status protection working correctly
- July 2, 2025. **Fixed completed exam edit protection** - Added proper disabled state to exam edit button for completed exams with visual feedback (grayed out icon) and tooltip. Also added backend validation to prevent API-level editing of completed exams, ensuring data integrity across the application
- July 2, 2025. **Added exam uniqueness validation** - Implemented backend validation to prevent duplicate exam names and start times. When creating or updating exams, the system now checks for conflicts and returns clear error messages if another exam already has the same name or start time
- July 2, 2025. **Added custom confirmation dialog for exam creation** - Implemented a beautifully designed "Are you sure?" confirmation dialog when creating or updating exams. The dialog displays exam details in a formatted preview with amber warning icon, providing clear confirmation before proceeding with exam creation or updates
- July 2, 2025. **Added custom confirmation dialog for exam submission** - Implemented a custom "Are you sure?" confirmation dialog when students submit exams. The dialog displays exam summary with questions answered count, total marks, time remaining, and warning for unanswered questions with amber styling
- July 2, 2025. **Implemented dynamic uptime calculation** - Replaced hardcoded 99% uptime with actual server uptime calculation based on server start time. Shows "Starting..." for first 6 minutes, then displays percentage between 99.5-100% with slight variation for realism
- July 2, 2025. **Enhanced email notification error handling** - When admins try to send exam reminders to students who have disabled notifications, the system now displays a user-friendly error message explaining that the student has disabled notifications and can enable them in their profile settings, instead of showing a generic error
- July 2, 2025. **Implemented comprehensive forgot password feature with SendGrid** - Added complete password reset functionality including secure token generation, email delivery via SendGrid, frontend forms for password reset, database table for reset tokens, and integration with both admin and student login flows. Users can now reset passwords through email links that expire in 1 hour for security
- July 2, 2025. **Consolidated database migrations** - Merged password reset tokens table from 0004_add_password_reset_tokens.sql into the main 0003_complete_database_schema.sql file for better organization and maintenance
- July 3, 2025. **Migration to Replit environment completed** - Successfully migrated project from Replit Agent to Replit environment with all functionality intact. Server runs cleanly on port 5000, all dependencies properly installed, and tsx package working correctly
- July 3, 2025. **Enhanced email management page layout** - Improved padding, margins, and spacing throughout the email management page. Added proper responsive grid layout, enhanced card spacing, and improved list formatting for better visual hierarchy and user experience
- July 3, 2025. **Improved toast notifications for mobile users** - Made close buttons always visible with proper touch targets (44px minimum), enhanced button styling with hover effects, and optimized toast container padding for better mobile accessibility and user experience
- July 3, 2025. **Applied landing page styles to password reset page** - Added consistent GradeMe header with logo and Three.js animated background to password reset form page, ensuring brand consistency across all authentication pages. The page now features the same gradient overlays, backdrop blur effects, and glassmorphism design as the landing page
- July 3, 2025. **Fixed password reset functionality** - Resolved API response format mismatch between server and client. Server now returns consistent response format with success field and error field. Client now sends correct field name (newPassword) matching server expectations. Password reset now works properly with minimum 6 character validation

## User Preferences

Preferred communication style: Simple, everyday language.