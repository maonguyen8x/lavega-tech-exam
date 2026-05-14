/**
 * Setup Script for Lavega Angular OAuth Project
 *
 * Validates system requirements (Node.js, package manager),
 * checks project structure, and prints next-step instructions.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  nodeMinVersion: '18.0.0',
  projectRoot: path.join(__dirname, '..'),
  requiredDirs: ['src', 'src/app', 'src/environments'],
  requiredFiles: [
    'angular.json',
    'tsconfig.json',
    'package.json',
    'src/index.html',
    'src/main.ts',
  ],
};

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${C[color]}${msg}${C.reset}`);
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function compareVersions(a, b) {
  const v1 = a.split('.').map(Number);
  const v2 = b.split('.').map(Number);
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const n1 = v1[i] || 0;
    const n2 = v2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function validateNode() {
  log('Checking Node.js version...', 'blue');
  const raw = run('node --version');
  if (!raw) {
    log('  Node.js is not installed', 'red');
    return false;
  }
  const version = raw.replace('v', '');
  if (compareVersions(version, CONFIG.nodeMinVersion) < 0) {
    log(`  Node.js >= ${CONFIG.nodeMinVersion} required (found ${version})`, 'red');
    return false;
  }
  log(`  Node.js ${version} — OK`, 'green');
  return true;
}

function validatePackageManager() {
  log('Checking package manager...', 'blue');
  const yarn = run('yarn --version');
  if (yarn) {
    log(`  Yarn ${yarn} — OK`, 'green');
    return true;
  }
  const npm = run('npm --version');
  if (npm) {
    log(`  npm ${npm} — OK`, 'green');
    return true;
  }
  log('  No package manager found (need npm or yarn)', 'red');
  return false;
}

function validateStructure() {
  log('Checking project structure...', 'blue');
  let ok = true;
  for (const d of CONFIG.requiredDirs) {
    if (!fs.existsSync(path.join(CONFIG.projectRoot, d))) {
      log(`  Missing directory: ${d}`, 'red');
      ok = false;
    }
  }
  for (const f of CONFIG.requiredFiles) {
    if (!fs.existsSync(path.join(CONFIG.projectRoot, f))) {
      log(`  Missing file: ${f}`, 'red');
      ok = false;
    }
  }
  if (ok) log('  Project structure — OK', 'green');
  return ok;
}

function main() {
  console.clear();
  log('=== Lavega Angular OAuth — Setup ===', 'blue');
  console.log('');

  let ok = true;
  if (!validateNode()) ok = false;
  console.log('');
  validatePackageManager();
  console.log('');
  if (!validateStructure()) ok = false;
  console.log('');

  if (!ok) {
    log('Setup failed — please fix the issues above.', 'red');
    process.exit(1);
  }

  log('All checks passed!', 'green');
  console.log('');
  log('Next steps:', 'blue');
  log('  1. Install dependencies:  npm install  (or yarn install)', 'blue');
  log('  2. Create config file:    cp .env.example .env', 'blue');
  log('  3. Fill in your Google OAuth credentials in .env', 'blue');
  log('  4. Start the app:         npm start    (or yarn start)', 'blue');
  log('  5. Open browser:          http://localhost:4200', 'blue');
  console.log('');
}

main();
