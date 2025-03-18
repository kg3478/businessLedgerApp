import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'business-ledger-app.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Archive created successfully!');
  console.log('Total bytes: ' + archive.pointer());
  console.log('Download the file from: ' + path.join(__dirname, 'business-ledger-app.zip'));
});

// Handle warnings and errors
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Define directories to include
const directories = [
  'client/src',
  'server',
  'shared',
  'uploads'
];

// Define individual files to include at the root level
const rootFiles = [
  'drizzle.config.ts',
  'package.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'theme.json',
  'tsconfig.json',
  'vite.config.ts',
  '.gitignore',
  'README.md'
];

// Add directories recursively
directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    archive.directory(dir, dir);
  } else {
    console.warn(`Directory not found: ${dir}`);
  }
});

// Add individual files
rootFiles.forEach(file => {
  if (fs.existsSync(file)) {
    archive.file(file, { name: file });
  } else {
    console.warn(`File not found: ${file}`);
  }
});

// Add a README with setup instructions if it doesn't exist
if (!fs.existsSync('README.md')) {
  const readmeContent = `# Business Ledger Application

A comprehensive digital ledger application for manufacturing businesses to replace physical records.

## Features

- Authentication system with login/register
- Party management for tracking business relationships 
- Transaction system for recording credits and deposits
- Bill upload and management integrated with transactions
- Dashboard with overview metrics and quick actions

## Setup Instructions

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

3. Navigate to http://localhost:5000 in your browser

## User Guide

1. Register a new account from the auth page
2. After login, you'll be redirected to the dashboard
3. Create business parties using the "Manage Parties" section
4. Record transactions (credits/deposits) for each party
5. Upload and associate bills with transactions
6. Monitor outstanding balances and party activities

## Tech Stack

- Frontend: React, TailwindCSS, ShadcnUI
- Backend: Node.js, Express
- Database: In-memory storage (can be upgraded to PostgreSQL)
- Authentication: Session-based with Passport.js
`;

  archive.append(readmeContent, { name: 'README.md' });
}

// Finalize the archive
archive.finalize();