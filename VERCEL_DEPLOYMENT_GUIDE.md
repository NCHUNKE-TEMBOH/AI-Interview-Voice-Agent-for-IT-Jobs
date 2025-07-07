# 🚀 Vercel Deployment Guide - Free Tier Optimized

## 📋 Pre-Deployment Checklist

### ✅ **Required Setup**
- [ ] Supabase project created and configured
- [ ] Google Gemini API key obtained
- [ ] OpenRouter API key obtained (optional but recommended)
- [ ] Environment variables prepared
- [ ] Project optimized for Vercel free tier

### ✅ **Vercel Free Tier Limits**
- **Bandwidth**: 100GB/month
- **Deployments**: 100/day
- **Function Timeout**: 10 seconds (we've set 30s max)
- **Function Size**: 50MB max
- **Edge Functions**: 1000 invocations/day
- **Build Time**: 45 minutes max

## 🔧 **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

## 🔐 **Step 2: Environment Variables Setup**

### **Option A: Vercel Dashboard (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Create new project or import from GitHub
3. Go to Project Settings → Environment Variables
4. Add the following variables:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
XAI_API_KEY=your_xai_key
GROQ_API_KEY=your_groq_key

# Production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### **Option B: Vercel CLI**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GOOGLE_GEMINI_API_KEY
vercel env add OPENROUTER_API_KEY
```

## 🚀 **Step 3: Deploy to Vercel**

### **Method 1: GitHub Integration (Recommended)**
1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure environment variables
5. Deploy automatically

### **Method 2: Vercel CLI**
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or deploy for preview
vercel
```

## ⚡ **Step 4: Optimization for Free Tier**

### **Bundle Size Optimization**
```bash
# Run the optimization script
node optimize-for-vercel.js

# Check bundle size
npm run build
```

### **API Route Optimization**
- All API routes are configured with 30-second timeout
- Using Node.js runtime for better performance
- Optimized for serverless functions

### **Image Optimization**
- WebP and AVIF formats enabled
- Optimized caching headers
- External domains configured

## 🔍 **Step 5: Post-Deployment Verification**

### **Test Core Features**
- [ ] Authentication (Google OAuth + Email)
- [ ] Job listings and applications
- [ ] Voice interview functionality
- [ ] AI feedback generation
- [ ] PDF download feature
- [ ] Database connections

### **Performance Monitoring**
- Check Vercel Analytics dashboard
- Monitor function execution times
- Watch for timeout errors
- Monitor bandwidth usage

## 🛠️ **Troubleshooting Common Issues**

### **Build Errors**
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

### **Function Timeout**
- Reduce AI model complexity
- Implement caching for repeated requests
- Optimize database queries

### **Bundle Size Too Large**
- Remove unused dependencies
- Use dynamic imports for large components
- Optimize images and assets

### **Environment Variables Not Working**
- Ensure variables are set in Vercel dashboard
- Check variable names match exactly
- Redeploy after adding new variables

## 📊 **Monitoring and Maintenance**

### **Free Tier Usage Monitoring**
- Check Vercel dashboard regularly
- Monitor bandwidth usage
- Track function invocations
- Watch build minutes

### **Performance Optimization**
- Use Vercel Analytics
- Monitor Core Web Vitals
- Optimize images and fonts
- Implement proper caching

## 🔄 **Continuous Deployment**

### **Automatic Deployments**
- Production: Push to `main` branch
- Preview: Push to any other branch
- Configure branch protection rules

### **Manual Deployments**
```bash
# Deploy specific branch
vercel --prod --confirm

# Deploy with custom domain
vercel --prod --confirm --scope your-team
```

## 🌐 **Custom Domain Setup**

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records
4. Enable HTTPS (automatic)

## 📈 **Scaling Beyond Free Tier**

When you need more resources:
- **Pro Plan**: $20/month per user
- **Team Plan**: $20/month per user + team features
- **Enterprise**: Custom pricing

### **Pro Plan Benefits**
- Unlimited bandwidth
- 1000 GB-hours of function execution
- Advanced analytics
- Password protection
- Custom redirects

## 🎯 **Success Metrics**

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ All environment variables are set
- ✅ Core features work correctly
- ✅ Performance is acceptable
- ✅ No timeout errors in functions
- ✅ Database connections are stable

## 📞 **Support Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**🎉 Congratulations! Your AI Interview Voice Agent is now live on Vercel!**
