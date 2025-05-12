# GradeMe-Replit
Exam Management Website

## Overview
GradeMe is an exam management system that helps educators track students, exams, and results. The application features a modern React frontend with a Node.js/Express backend.

## Features
- Student management
- Exam scheduling and tracking
- Results recording and analysis
- Dashboard with statistics
- User authentication

## Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/grademe-replit.git
cd grademe-replit
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory with the following content:
```
NODE_ENV=development
SESSION_SECRET=your-session-secret
```

If you want to use a PostgreSQL database instead of in-memory storage, add:
```
DATABASE_URL=postgres://username:password@localhost:5432/grademe
```

## Running the application

### Quick Start (Recommended for all platforms)
```bash
node run-local.js
```
This all-in-one script will:
1. Create the necessary .env file if it doesn't exist
2. Install dependencies if needed
3. Start the development server

### Alternative Options

#### Option 1: Using npm script (Unix/Mac/Linux)
```bash
npm run dev
```

#### Option 2: Basic cross-platform script
```bash
node start-local.js
```

All options will start the server on http://localhost:5000

### Production build
```bash
npm run build
npm start
```

## Login credentials
Default admin user:
- Email: admin@grademe.com
- Password: password123

## Project structure
- `client/` - Frontend React application
- `server/` - Backend Express server
- `shared/` - Shared types and schemas used by both frontend and backend

## Development notes
- The project uses an in-memory database by default. No additional setup is required.
- If you want to use PostgreSQL, make sure to provision a database and update the DATABASE_URL environment variable.

## Detailed Development Guide

For a more comprehensive guide to local development, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

## Troubleshooting

### "Error: Cannot find module..."
Make sure all dependencies are installed:
```bash
npm install
```

### Environment variable issues
On Windows, environment variables in scripts might not work properly. Use the provided `start-local.js` script instead of `npm run dev`.

### Port already in use
If port 5000 is already in use on your system, you can modify the port in `server/index.ts` (look for `const port = 5000`).

### Database connection issues
- If using the default in-memory storage, no database configuration is needed.
- If using PostgreSQL, verify your connection string in the `.env` file.

### Page not loading
- Check that both the Express server and Vite development server are running.
- Check browser console for any errors.
- Try clearing browser cache or using incognito mode.