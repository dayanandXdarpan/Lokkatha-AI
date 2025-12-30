#!/usr/bin/env node

/**
 * LokKatha AI 2.0 - System Diagnostics Script
 * 
 * This script checks:
 * 1. Redis installation and connection
 * 2. Backend API connectivity
 * 3. Frontend availability
 * 4. Environment configuration
 * 5. Required dependencies
 * 6. System requirements
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const OK = `${colors.green}✅${colors.reset}`;
const FAIL = `${colors.red}❌${colors.reset}`;
const WARN = `${colors.yellow}⚠️${colors.reset}`;
const INFO = `${colors.blue}ℹ️${colors.reset}`;

console.log(`\n${'='.repeat(60)}`);
console.log(`  ${colors.bold}🔍 LokKatha AI 2.0 - System Diagnostics${colors.reset}`);
console.log(`${'='.repeat(60)}\n`);

// Store diagnostics results
const diagnostics = {
  redis: { installed: false, running: false, connectable: false },
  backend: { configured: false, running: false },
  frontend: { running: false },
  env: { valid: false, missingKeys: [] },
  dependencies: { ffmpeg: false, node: false },
  recommendations: []
};

/**
 * Check if Redis is installed
 */
function checkRedisInstalled() {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${colors.bold}CHECK 1: Redis Installation${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    exec('where redis-server', (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`${FAIL} Redis is NOT installed`);
        console.log(`${INFO} Redis is REQUIRED for video generation`);
        diagnostics.redis.installed = false;
        diagnostics.recommendations.push('Install Redis (see REDIS_SETUP_GUIDE.md)');
      } else {
        console.log(`${OK} Redis is installed: ${stdout.trim()}`);
        diagnostics.redis.installed = true;
      }
      resolve();
    });
  });
}

/**
 * Check if Redis service is running
 */
function checkRedisRunning() {
  return new Promise((resolve) => {
    exec('redis-cli ping', (error, stdout) => {
      if (error || !stdout.includes('PONG')) {
        console.log(`${FAIL} Redis is NOT running`);
        diagnostics.redis.running = false;
        if (diagnostics.redis.installed) {
          diagnostics.recommendations.push('Start Redis with: redis-server');
        }
      } else {
        console.log(`${OK} Redis is running`);
        diagnostics.redis.running = true;
        diagnostics.redis.connectable = true;
      }
      resolve();
    });
  });
}

/**
 * Check backend .env configuration
 */
function checkEnvConfiguration() {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${colors.bold}CHECK 2: Environment Configuration${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log(`${FAIL} .env file not found`);
      diagnostics.env.valid = false;
      diagnostics.recommendations.push('Create .env file in backend directory');
      resolve();
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredKeys = [
      'GEMINI_API_KEY',
      'GOOGLE_TTS_API_KEY',
      'PEXELS_API_KEY',
      'REDIS_HOST',
      'REDIS_PORT',
      'PORT'
    ];
    
    const missingKeys = [];
    requiredKeys.forEach(key => {
      const regex = new RegExp(`^${key}=.+`, 'm');
      if (!regex.test(envContent)) {
        missingKeys.push(key);
      }
    });
    
    if (missingKeys.length > 0) {
      console.log(`${WARN} Missing environment variables:`);
      missingKeys.forEach(key => {
        console.log(`   - ${key}`);
      });
      diagnostics.env.valid = false;
      diagnostics.env.missingKeys = missingKeys;
      diagnostics.recommendations.push('Add missing environment variables to .env');
    } else {
      console.log(`${OK} All required environment variables configured`);
      diagnostics.env.valid = true;
    }
    
    // Check API keys are not placeholders
    const apiKeys = ['GEMINI_API_KEY', 'GOOGLE_TTS_API_KEY', 'PEXELS_API_KEY'];
    apiKeys.forEach(key => {
      const match = envContent.match(new RegExp(`${key}=(.+)`));
      if (match && match[1].includes('your_') || match[1].includes('placeholder')) {
        console.log(`${WARN} ${key} appears to be a placeholder value`);
        diagnostics.recommendations.push(`Update ${key} with real API key`);
      } else if (match) {
        console.log(`${OK} ${key} configured`);
      }
    });
    
    diagnostics.backend.configured = diagnostics.env.valid;
    resolve();
  });
}

/**
 * Check if backend API is running
 */
function checkBackendRunning() {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${colors.bold}CHECK 3: Backend API Status${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`${OK} Backend API is running on http://localhost:3000`);
          diagnostics.backend.running = true;
          try {
            const health = JSON.parse(data);
            if (health.redis && health.redis.connected) {
              console.log(`${OK} Backend connected to Redis`);
              diagnostics.redis.connectable = true;
            } else {
              console.log(`${WARN} Backend NOT connected to Redis`);
              diagnostics.recommendations.push('Ensure Redis is running before starting backend');
            }
          } catch (e) {
            // Health check doesn't return JSON
          }
        } else {
          console.log(`${FAIL} Backend API returned status ${res.statusCode}`);
          diagnostics.backend.running = false;
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`${FAIL} Backend API is NOT running`);
      console.log(`${INFO} Start backend with: cd backend && npm run dev`);
      diagnostics.backend.running = false;
      diagnostics.recommendations.push('Start backend server: cd backend && npm run dev');
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`${FAIL} Backend API connection timeout`);
      diagnostics.backend.running = false;
      resolve();
    });
    
    req.end();
  });
}

/**
 * Check if frontend is running
 */
function checkFrontendRunning() {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${colors.bold}CHECK 4: Frontend Status${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET',
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`${OK} Frontend is running on http://localhost:5173`);
        diagnostics.frontend.running = true;
      } else {
        console.log(`${FAIL} Frontend returned status ${res.statusCode}`);
        diagnostics.frontend.running = false;
      }
      resolve();
    });
    
    req.on('error', () => {
      console.log(`${FAIL} Frontend is NOT running`);
      console.log(`${INFO} Start frontend with: cd frontend && npm run dev`);
      diagnostics.frontend.running = false;
      diagnostics.recommendations.push('Start frontend: cd frontend && npm run dev');
      resolve();
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`${FAIL} Frontend connection timeout`);
      diagnostics.frontend.running = false;
      resolve();
    });
    
    req.end();
  });
}

/**
 * Check required dependencies
 */
function checkDependencies() {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${colors.bold}CHECK 5: System Dependencies${colors.reset}`);
    console.log(`${'='.repeat(60)}`);
    
    // Check Node.js
    exec('node --version', (error, stdout) => {
      if (error) {
        console.log(`${FAIL} Node.js is NOT installed`);
        diagnostics.dependencies.node = false;
      } else {
        console.log(`${OK} Node.js version: ${stdout.trim()}`);
        diagnostics.dependencies.node = true;
      }
      
      // Check FFmpeg
      exec('ffmpeg -version', (error, stdout) => {
        if (error) {
          console.log(`${WARN} FFmpeg is NOT installed`);
          console.log(`${INFO} FFmpeg is required for video generation`);
          diagnostics.dependencies.ffmpeg = false;
          diagnostics.recommendations.push('Install FFmpeg: choco install ffmpeg -y');
        } else {
          const version = stdout.split('\n')[0];
          console.log(`${OK} FFmpeg installed: ${version}`);
          diagnostics.dependencies.ffmpeg = true;
        }
        resolve();
      });
    });
  });
}

/**
 * Print summary and recommendations
 */
function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${colors.bold}📊 DIAGNOSTICS SUMMARY${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`${colors.bold}System Status:${colors.reset}`);
  console.log(`  Redis Installed:    ${diagnostics.redis.installed ? OK : FAIL}`);
  console.log(`  Redis Running:      ${diagnostics.redis.running ? OK : FAIL}`);
  console.log(`  Backend Running:    ${diagnostics.backend.running ? OK : FAIL}`);
  console.log(`  Frontend Running:   ${diagnostics.frontend.running ? OK : FAIL}`);
  console.log(`  FFmpeg Installed:   ${diagnostics.dependencies.ffmpeg ? OK : WARN}`);
  console.log(`  Environment Config: ${diagnostics.env.valid ? OK : WARN}`);
  
  const allGood = diagnostics.redis.running && 
                  diagnostics.backend.running && 
                  diagnostics.frontend.running &&
                  diagnostics.dependencies.ffmpeg &&
                  diagnostics.env.valid;
  
  if (allGood) {
    console.log(`\n${colors.green}${colors.bold}🎉 ALL SYSTEMS OPERATIONAL!${colors.reset}`);
    console.log(`${OK} Ready to generate videos!`);
    console.log(`\n${INFO} Run test script: ${colors.bold}node backend/test-workflow.js${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  ISSUES DETECTED${colors.reset}`);
    
    if (diagnostics.recommendations.length > 0) {
      console.log(`\n${colors.bold}🔧 Recommended Actions:${colors.reset}`);
      diagnostics.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    // Print quick start guide
    console.log(`\n${colors.bold}🚀 Quick Start:${colors.reset}`);
    
    if (!diagnostics.redis.installed) {
      console.log(`\n  ${colors.bold}Step 1: Install Redis${colors.reset}`);
      console.log(`  ${INFO} See: backend/REDIS_SETUP_GUIDE.md`);
      console.log(`  ${INFO} Quick install: ${colors.bold}choco install redis-64 -y${colors.reset}`);
    }
    
    if (!diagnostics.redis.running && diagnostics.redis.installed) {
      console.log(`\n  ${colors.bold}Step 2: Start Redis${colors.reset}`);
      console.log(`  ${colors.bold}redis-server${colors.reset}`);
    }
    
    if (!diagnostics.backend.running) {
      console.log(`\n  ${colors.bold}Step 3: Start Backend${colors.reset}`);
      console.log(`  ${colors.bold}cd backend && npm run dev${colors.reset}`);
    }
    
    if (!diagnostics.frontend.running) {
      console.log(`\n  ${colors.bold}Step 4: Start Frontend${colors.reset}`);
      console.log(`  ${colors.bold}cd frontend && npm run dev${colors.reset}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
}

/**
 * Main diagnostics runner
 */
async function runDiagnostics() {
  try {
    await checkRedisInstalled();
    await checkRedisRunning();
    await checkEnvConfiguration();
    await checkBackendRunning();
    await checkFrontendRunning();
    await checkDependencies();
    printSummary();
  } catch (error) {
    console.error(`${FAIL} Diagnostics failed:`, error);
  }
}

// Run diagnostics
runDiagnostics();
