# Local Development Guide

This document provides step-by-step instructions to set up and run the GradeMe application on your local machine.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (v7 or higher) - included with Node.js
- Git
- Text editor (VS Code recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd grademe-replit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```
NODE_ENV=development
SESSION_SECRET=your-secret-key
```

### 4. Start the Development Server

#### For macOS/Linux users:

```bash
npm run dev
```

#### For Windows users:

```bash
node start-local.js
```

This will start the server on http://localhost:5000

## Login Credentials

Use these credentials to log in:

- Email: admin@grademe.com
- Password: password123

## Project Structure

- `client/` - Frontend React application
- `server/` - Backend Express server
- `shared/` - Shared types and schemas

## Common Issues and Solutions

### Port Already in Use

If port 5000 is already in use, modify the port in `server/index.ts`.

### "Cannot find module" Error

Ensure all dependencies are installed with:

```bash
npm install
```

### Windows Environment Variable Issues

Use the provided `start-local.js` script which handles environment variables properly on Windows.

## Database

By default, the application uses in-memory storage, so no database configuration is needed.

If you want to use PostgreSQL:

1. Create a local database
2. Add this to your `.env` file:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/grademe
   ```

## Testing Your Changes

After making changes, restart the development server to see your changes reflected in the application.