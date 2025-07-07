#!/usr/bin/env node

/**
 * Tailwind CSS v4 Configuration Fix
 * This script ensures proper configuration for Tailwind CSS v4 deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Tailwind CSS v4 configuration for Vercel deployment...\n');

// 1. Update package.json to ensure correct dependencies
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('📦 Updating package.json dependencies...');

// Ensure we have the correct Tailwind CSS v4 dependencies
packageJson.dependencies = packageJson.dependencies || {};
packageJson.dependencies['tailwindcss'] = '^4.1.11';
packageJson.dependencies['@tailwindcss/postcss'] = '^4.1.11';

// Remove any conflicting devDependencies
if (packageJson.devDependencies && packageJson.devDependencies['@tailwindcss/postcss']) {
    delete packageJson.devDependencies['@tailwindcss/postcss'];
}

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with Tailwind CSS v4 dependencies');

// 2. Update PostCSS configuration
const postcssPath = path.join(__dirname, 'postcss.config.mjs');
const postcssConfig = `const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
`;

fs.writeFileSync(postcssPath, postcssConfig);
console.log('✅ Updated PostCSS configuration for Tailwind CSS v4');

// 3. Update globals.css
const globalsPath = path.join(__dirname, 'app', 'globals.css');
if (fs.existsSync(globalsPath)) {
    let globalsContent = fs.readFileSync(globalsPath, 'utf8');
    
    // Replace old Tailwind directives with v4 import
    globalsContent = globalsContent.replace(
        /@tailwind base;\s*@tailwind components;\s*@tailwind utilities;/g,
        '@import "tailwindcss";'
    );
    
    // Ensure we start with the correct import
    if (!globalsContent.startsWith('@import "tailwindcss";')) {
        globalsContent = '@import "tailwindcss";\n\n' + globalsContent.replace('@import "tailwindcss";', '');
    }
    
    fs.writeFileSync(globalsPath, globalsContent);
    console.log('✅ Updated globals.css for Tailwind CSS v4');
}

// 4. Remove conflicting Tailwind config files
const configFiles = [
    'tailwind.config.js',
    'tailwind.config.ts',
    'tailwind.config.mjs'
];

configFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed conflicting config file: ${file}`);
    }
});

// 5. Verify configuration
console.log('\n🎯 Configuration Summary:');
console.log('- Tailwind CSS: v4.1.11 (latest)');
console.log('- PostCSS Plugin: @tailwindcss/postcss v4.1.11');
console.log('- CSS Import: @import "tailwindcss"');
console.log('- Config Files: Removed (v4 uses CSS-based config)');

console.log('\n✅ Tailwind CSS v4 configuration complete!');
console.log('🚀 Ready for Vercel deployment');

console.log('\n📋 Next Steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build (to test locally)');
console.log('3. Push to GitHub and deploy to Vercel');

console.log('\n🔐 Environment Variables for Vercel:');
console.log('- NEXT_PUBLIC_SUPABASE_URL');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('- GOOGLE_GEMINI_API_KEY');
console.log('- OPENROUTER_API_KEY');
console.log('- NODE_ENV=production');
