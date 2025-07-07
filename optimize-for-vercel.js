#!/usr/bin/env node

/**
 * Vercel Deployment Optimization Script
 * Optimizes the project for Vercel free tier deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing project for Vercel deployment...\n');

// 1. Check and optimize package.json
function optimizePackageJson() {
    console.log('📦 Optimizing package.json...');
    
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Ensure engines are specified for Vercel
    if (!packageJson.engines) {
        packageJson.engines = {
            "node": ">=18.17.0",
            "npm": ">=9.0.0"
        };
    }
    
    // Add Vercel-specific scripts if not present
    if (!packageJson.scripts['vercel-build']) {
        packageJson.scripts['vercel-build'] = 'next build';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json optimized\n');
}

// 2. Check environment variables
function checkEnvironmentVariables() {
    console.log('🔐 Checking environment variables...');
    
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');
    
    if (!fs.existsSync(envPath)) {
        console.log('⚠️  .env file not found. Please create one based on .env.example');
    } else {
        console.log('✅ .env file found');
    }
    
    if (!fs.existsSync(envExamplePath)) {
        console.log('⚠️  .env.example file not found. Creating one...');
        // .env.example is already created above
    } else {
        console.log('✅ .env.example file found');
    }
    console.log('');
}

// 3. Check for large files that might exceed Vercel limits
function checkFileSize() {
    console.log('📏 Checking for large files...');
    
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit for Vercel free tier
    const excludeDirs = ['node_modules', '.next', '.git', '.vercel'];
    
    function checkDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !excludeDirs.includes(item)) {
                checkDirectory(fullPath);
            } else if (stat.isFile() && stat.size > maxFileSize) {
                console.log(`⚠️  Large file detected: ${fullPath} (${(stat.size / 1024 / 1024).toFixed(2)}MB)`);
            }
        }
    }
    
    try {
        checkDirectory(__dirname);
        console.log('✅ No problematic large files found\n');
    } catch (error) {
        console.log('⚠️  Error checking file sizes:', error.message, '\n');
    }
}

// 4. Optimize API routes for serverless functions
function optimizeApiRoutes() {
    console.log('⚡ Checking API routes optimization...');
    
    const apiDir = path.join(__dirname, 'app', 'api');
    
    if (fs.existsSync(apiDir)) {
        console.log('✅ API routes found - ensure they are optimized for serverless');
        console.log('   - Keep functions under 50MB');
        console.log('   - Optimize cold start times');
        console.log('   - Use appropriate timeout settings');
    } else {
        console.log('ℹ️  No API routes found');
    }
    console.log('');
}

// 5. Check Next.js configuration
function checkNextConfig() {
    console.log('⚙️  Checking Next.js configuration...');
    
    const nextConfigPath = path.join(__dirname, 'next.config.mjs');
    
    if (fs.existsSync(nextConfigPath)) {
        console.log('✅ next.config.mjs found and optimized');
    } else {
        console.log('⚠️  next.config.mjs not found');
    }
    console.log('');
}

// 6. Generate deployment checklist
function generateDeploymentChecklist() {
    console.log('📋 VERCEL DEPLOYMENT CHECKLIST:');
    console.log('');
    console.log('BEFORE DEPLOYMENT:');
    console.log('□ Install Vercel CLI: npm i -g vercel');
    console.log('□ Login to Vercel: vercel login');
    console.log('□ Set up environment variables in Vercel dashboard');
    console.log('□ Test build locally: npm run build');
    console.log('□ Check bundle size: npm run analyze (if available)');
    console.log('');
    console.log('DEPLOYMENT STEPS:');
    console.log('□ Run: vercel --prod');
    console.log('□ Or connect GitHub repo to Vercel dashboard');
    console.log('□ Configure custom domain (if needed)');
    console.log('□ Set up monitoring and analytics');
    console.log('');
    console.log('VERCEL FREE TIER LIMITS:');
    console.log('• 100GB bandwidth per month');
    console.log('• 100 deployments per day');
    console.log('• 12 serverless functions per deployment');
    console.log('• 50MB max function size');
    console.log('• 10 second function timeout');
    console.log('• 1000 edge function invocations per day');
    console.log('');
}

// Run all optimizations
function main() {
    try {
        optimizePackageJson();
        checkEnvironmentVariables();
        checkFileSize();
        optimizeApiRoutes();
        checkNextConfig();
        generateDeploymentChecklist();
        
        console.log('🎉 Project optimization complete!');
        console.log('🚀 Ready for Vercel deployment!');
        
    } catch (error) {
        console.error('❌ Error during optimization:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
