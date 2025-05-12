/**
 * Local Development Setup and Run Script
 * This cross-platform script helps set up and run the GradeMe application locally
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Set environment variables
process.env.NODE_ENV = 'development';

// Get correct command based on platform
const isWindows = os.platform() === 'win32';
const nodeCommand = isWindows ? 'npx.cmd' : 'npx';

// Check if .env file exists
function checkEnvFile() {
  if (!fs.existsSync('.env')) {
    console.log('Creating .env file...');
    fs.writeFileSync('.env', 'NODE_ENV=development\nSESSION_SECRET=local-dev-secret\n');
    console.log('Created .env file successfully.');
  } else {
    console.log('.env file already exists.');
  }
}

// Run npm install if node_modules doesn't exist
function installDependencies() {
  if (!fs.existsSync('node_modules')) {
    console.log('Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Error installing dependencies:', error);
      process.exit(1);
    }
  } else {
    console.log('Dependencies already installed.');
  }
}

// Start the server
function startServer() {
  console.log('Starting development server...');
  const serverProcess = spawn(nodeCommand, ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  // Handle process exit
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}

// Main function
function main() {
  console.log('⭐️ GradeMe Local Development Setup ⭐️');
  
  // Setup environment
  checkEnvFile();
  installDependencies();
  
  console.log('\n🚀 Setup complete! Starting server...\n');
  
  // Start server
  startServer();
  
  console.log('\n💻 Server running at http://localhost:5000');
  console.log('👤 Login with: admin@grademe.com / password123\n');
}

// Run the main function
main();