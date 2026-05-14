/**
 * Generates environment.local.ts from .env variables.
 *
 * Architecture:
 *   - environment.ts       → committed to Git (empty/safe template)
 *   - environment.local.ts → generated from .env (git-ignored, contains real credentials)
 *   - angular.json          → fileReplacements swaps .ts → .local.ts at build time
 *
 * This script runs automatically before start/build via package.json scripts.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const ENV_FILE_PATH = path.join(PROJECT_ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(PROJECT_ROOT, '.env.example');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'environments');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'environment.local.ts');

const REQUIRED_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_AUTH_ENDPOINT',
  'GOOGLE_TOKEN_ENDPOINT',
  'GOOGLE_USERINFO_ENDPOINT',
  'GOOGLE_REVOKE_ENDPOINT',
];

const DEFAULTS = {
  GOOGLE_SCOPE: 'profile email',
  PRODUCTION: 'false',
  SESSION_STORAGE_KEY: 'oauth_session',
  API_TIMEOUT: '30000',
  API_RETRY_ATTEMPTS: '3',
  API_RETRY_DELAY: '1000',
};

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const idx = trimmed.indexOf('=');
    if (idx === -1) return;

    result[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
  });

  return result;
}

function val(envVars, key) {
  return envVars[key] || DEFAULTS[key] || '';
}

function validateEnvVars(envVars) {
  const missing = REQUIRED_KEYS.filter((key) => !envVars[key]);
  if (missing.length > 0) {
    console.error(`\x1b[31mMissing required env vars: ${missing.join(', ')}\x1b[0m`);
    console.error('\x1b[33mRun: cp .env.example .env  then fill in your credentials\x1b[0m');
    process.exit(1);
  }
}

function buildContent(env) {
  const isProd = val(env, 'PRODUCTION') === 'true';

  return `/**
 * Local environment — GENERATED FILE (git-ignored)
 * Auto-generated from .env by scripts/generate-env.js
 * DO NOT edit — update .env and re-run: npm run env:generate
 */
export const environment = {
  production: ${isProd},
  google: {
    clientId: '${val(env, 'GOOGLE_CLIENT_ID')}',
    clientSecret: '${val(env, 'GOOGLE_CLIENT_SECRET')}',
    redirectUri: '${val(env, 'GOOGLE_REDIRECT_URI')}',
    scope: '${val(env, 'GOOGLE_SCOPE')}',
    authorizationEndpoint: '${val(env, 'GOOGLE_AUTH_ENDPOINT')}',
    tokenEndpoint: '${val(env, 'GOOGLE_TOKEN_ENDPOINT')}',
    userInfoEndpoint: '${val(env, 'GOOGLE_USERINFO_ENDPOINT')}',
    revokeEndpoint: '${val(env, 'GOOGLE_REVOKE_ENDPOINT')}',
  },
  session: {
    storageKey: '${val(env, 'SESSION_STORAGE_KEY')}',
    useSessionStorage: true,
  },
  api: {
    timeout: ${parseInt(val(env, 'API_TIMEOUT'), 10)},
    retryAttempts: ${parseInt(val(env, 'API_RETRY_ATTEMPTS'), 10)},
    retryDelay: ${parseInt(val(env, 'API_RETRY_DELAY'), 10)},
  },
};
`;
}

function main() {
  console.log('\x1b[34m[env] Generating environment.local.ts from .env ...\x1b[0m');

  let envVars = parseEnvFile(ENV_FILE_PATH);

  if (!envVars) {
    console.warn('\x1b[33m[env] .env not found, falling back to .env.example\x1b[0m');
    envVars = parseEnvFile(ENV_EXAMPLE_PATH);
  }

  if (!envVars) {
    console.error('\x1b[31m[env] Neither .env nor .env.example found\x1b[0m');
    process.exit(1);
  }

  validateEnvVars(envVars);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, buildContent(envVars), 'utf-8');
  console.log(`\x1b[32m[env] Created: ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}\x1b[0m`);
}

main();
