#!/usr/bin/env node

/**
 * Final Deployment Verification Script
 * Ensures all Tailwind CSS v4 configuration is correct for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Tailwind CSS v4 deployment configuration...\n');

let allGood = true;

// 1. Check package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('📦 Checking package.json...');
if (packageJson.dependencies['tailwindcss'] === '^4.1.11') {
    console.log('✅ Tailwind CSS v4.1.11 correctly specified');
} else {
    console.log('❌ Tailwind CSS version incorrect');
    allGood = false;
}

if (packageJson.dependencies['@tailwindcss/postcss'] === '^4.1.11') {
    console.log('✅ @tailwindcss/postcss v4.1.11 correctly specified');
} else {
    console.log('❌ @tailwindcss/postcss missing or incorrect version');
    allGood = false;
}

// 2. Check PostCSS config
const postcssPath = path.join(__dirname, 'postcss.config.mjs');
if (fs.existsSync(postcssPath)) {
    const postcssContent = fs.readFileSync(postcssPath, 'utf8');
    if (postcssContent.includes('@tailwindcss/postcss')) {
        console.log('✅ PostCSS configured for Tailwind CSS v4');
    } else {
        console.log('❌ PostCSS configuration incorrect');
        allGood = false;
    }
} else {
    console.log('❌ PostCSS config file missing');
    allGood = false;
}

// 3. Check globals.css
const globalsPath = path.join(__dirname, 'app', 'globals.css');
if (fs.existsSync(globalsPath)) {
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    
    if (globalsContent.startsWith('@import "tailwindcss";')) {
        console.log('✅ globals.css uses correct Tailwind CSS v4 import');
    } else {
        console.log('❌ globals.css missing or incorrect Tailwind import');
        allGood = false;
    }
    
    if (globalsContent.includes('@layer')) {
        console.log('❌ globals.css still contains @layer directives (incompatible with v4)');
        allGood = false;
    } else {
        console.log('✅ globals.css free of incompatible @layer directives');
    }
} else {
    console.log('❌ globals.css file missing');
    allGood = false;
}

// 4. Check for conflicting config files
const conflictingFiles = [
    'tailwind.config.js',
    'tailwind.config.ts',
    'tailwind.config.mjs'
];

conflictingFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`⚠️  Found potentially conflicting file: ${file} (may cause issues with v4)`);
    }
});

console.log('\n🎯 Configuration Summary:');
console.log('- Tailwind CSS: v4.1.11');
console.log('- PostCSS Plugin: @tailwindcss/postcss v4.1.11');
console.log('- CSS Import: @import "tailwindcss"');
console.log('- Layer Directives: Removed (v4 compatible)');

if (allGood) {
    console.log('\n✅ All checks passed! Configuration is correct for Vercel deployment.');
    console.log('🚀 Ready to deploy to Vercel');
    
    console.log('\n📋 Deployment Steps:');
    console.log('1. git add . && git commit -m "Fix Tailwind CSS v4 configuration" && git push');
    console.log('2. Deploy via Vercel dashboard or CLI: vercel --prod');
    console.log('3. Set environment variables in Vercel dashboard');
    
    console.log('\n🔐 Required Environment Variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('- GOOGLE_GEMINI_API_KEY');
    console.log('- OPENROUTER_API_KEY');
    console.log('- NODE_ENV=production');
} else {
    console.log('\n❌ Configuration issues found. Please fix the above errors before deploying.');
}

console.log('\n🎉 Verification complete!');
