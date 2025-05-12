/**
 * Cross-platform script to start the local development server
 * This provides an alternative to the npm scripts for better Windows compatibility
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Set environment variables
process.env.NODE_ENV = 'development';

// Get correct command based on platform
const isWindows = os.platform() === 'win32';
const nodeCommand = isWindows ? 'npx.cmd' : 'npx';

// Start the server with tsx
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