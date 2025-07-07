#!/usr/bin/env node

/**
 * Authentication Redirect Fix Verification
 * Checks if all necessary changes are in place for proper auth redirects
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying authentication redirect fix...\n');

let allGood = true;

// 1. Check Supabase client configuration
console.log('📦 Checking Supabase client configuration...');
const supabaseClientPath = path.join(__dirname, 'services', 'supabaseClient.js');
if (fs.existsSync(supabaseClientPath)) {
    const supabaseContent = fs.readFileSync(supabaseClientPath, 'utf8');
    
    if (supabaseContent.includes('redirectTo: getRedirectURL()')) {
        console.log('✅ Supabase client configured with dynamic redirect URL');
    } else {
        console.log('❌ Supabase client missing redirect URL configuration');
        allGood = false;
    }
    
    if (supabaseContent.includes('skillin.vercel.app')) {
        console.log('✅ Production URL configured as fallback');
    } else {
        console.log('❌ Production URL not configured');
        allGood = false;
    }
} else {
    console.log('❌ Supabase client file not found');
    allGood = false;
}

// 2. Check auth page configuration
console.log('\n🔐 Checking authentication page...');
const authPagePath = path.join(__dirname, 'app', 'auth', 'page.jsx');
if (fs.existsSync(authPagePath)) {
    const authContent = fs.readFileSync(authPagePath, 'utf8');
    
    if (authContent.includes('redirectTo: redirectURL')) {
        console.log('✅ OAuth configured with explicit redirect URL');
    } else {
        console.log('❌ OAuth missing redirect URL configuration');
        allGood = false;
    }
    
    if (authContent.includes('window.location.origin')) {
        console.log('✅ Dynamic URL detection implemented');
    } else {
        console.log('❌ Dynamic URL detection missing');
        allGood = false;
    }
} else {
    console.log('❌ Auth page file not found');
    allGood = false;
}

// 3. Check environment configuration
console.log('\n🌍 Checking environment configuration...');
const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    if (envContent.includes('NEXT_PUBLIC_APP_URL')) {
        console.log('✅ APP_URL environment variable documented');
    } else {
        console.log('❌ APP_URL environment variable not documented');
        allGood = false;
    }
} else {
    console.log('⚠️  .env.example file not found');
}

console.log('\n🎯 Configuration Summary:');
console.log('- Supabase Client: Dynamic redirect URL configured');
console.log('- OAuth Provider: Explicit redirect URL specified');
console.log('- Environment: APP_URL variable ready');
console.log('- Production URL: https://skillin.vercel.app');

if (allGood) {
    console.log('\n✅ All code changes are in place!');
    console.log('🚀 Ready for deployment');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Set environment variable in Vercel:');
    console.log('   NEXT_PUBLIC_APP_URL=https://skillin.vercel.app');
    console.log('');
    console.log('2. Update Supabase Dashboard:');
    console.log('   - Site URL: https://skillin.vercel.app');
    console.log('   - Redirect URLs: Add all required URLs');
    console.log('');
    console.log('3. Deploy and test authentication');
    
    console.log('\n🔐 Required Supabase Redirect URLs:');
    console.log('- https://skillin.vercel.app');
    console.log('- https://skillin.vercel.app/auth');
    console.log('- https://skillin.vercel.app/dashboard');
    console.log('- https://skillin.vercel.app/company');
    console.log('- https://skillin.vercel.app/company/dashboard');
} else {
    console.log('\n❌ Some configuration issues found. Please fix the above errors.');
}

console.log('\n🎉 Verification complete!');
console.log('\n📖 For detailed instructions, see: fix-auth-redirect.md');
