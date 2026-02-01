# AI Interview Voice Agent for IT Jobs - Project Index

## 📋 Project Overview

**Project Name:** AI Interview Voice Agent for IT Jobs  
**Type:** Full-stack Web Application  
**Tech Stack:** Next.js 14 (App Router), React, Supabase, Vapi AI, Pinecone, Python (FastAPI)  
**Purpose:** AI-powered voice interview platform for IT job candidates and companies

---

## 🏗️ Architecture Overview

### Frontend (Next.js 14)
- **Framework:** Next.js 14 with App Router
- **UI Library:** React with Tailwind CSS v4
- **Components:** Shadcn/ui components
- **State Management:** React Context, Supabase Auth
- **Routing:** File-based routing with route groups

### Backend Services
- **Database:** Supabase (PostgreSQL)
- **AI Voice:** Vapi AI API
- **AI Text:** OpenAI GPT-4o
- **Vector Search:** Pinecone (for RAG system)
- **Python Service:** FastAPI for document processing

---

## 📁 Directory Structure

```
AI-Interview-Voice-Agent-for-IT-Jobs/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Main authenticated routes
│   │   ├── dashboard/            # User dashboard
│   │   ├── company/              # Company features
│   │   ├── billing/              # Billing & payments
│   │   ├── jobs/                 # Job listings
│   │   ├── settings/             # User settings
│   │   └── scheduled-interview/  # Scheduled interviews
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # API routes
│   ├── auth/                     # Authentication pages
│   ├── guest/                    # Guest interview flow
│   ├── interview/                # Interview interface
│   └── jobs/                     # Public job pages
├── components/                   # Reusable components
│   ├── ui/                       # Shadcn/ui components
│   └── magicui/                  # Magic UI components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client & queries
│   ├── vapi/                     # Vapi AI integration
│   ├── openai/                   # OpenAI integration
│   └── python-service-client.js  # Python service client
├── python-service/               # Python FastAPI service
│   ├── main.py                   # FastAPI application
│   └── requirements.txt          # Python dependencies
└── public/                       # Static assets
```

---

## 🗄️ Database Schema (Supabase)

### Core Tables

#### `profiles`
- User profile information
- Fields: id, email, full_name, avatar_url, role, created_at, updated_at

#### `companies`
- Company profiles
- Fields: id, name, description, website, logo_url, industry, size, location, created_by

#### `jobs`
- Job postings
- Fields: id, company_id, title, description, requirements, salary_range, location, job_type, status

#### `interviews`
- Interview sessions
- Fields: id, user_id, job_id, title, description, questions, status, duration, created_at

#### `interview_responses`
- Interview answers
- Fields: id, interview_id, question_id, answer_text, audio_url, duration, feedback

#### `interview_questions`
- Interview questions
- Fields: id, interview_id, question_text, question_type, order, time_limit

#### `cv_screening`
- CV screening records
- Fields: id, user_id, job_id, cv_url, extracted_text, screening_result, match_score, created_at

#### `billing_subscriptions`
- Subscription management
- Fields: id, user_id, plan_id, status, current_period_start, current_period_end

#### `billing_invoices`
- Invoice records
- Fields: id, user_id, subscription_id, amount, status, paid_at

#### `system_logs`
- System logging
- Fields: id, level, message, context, created_at

#### `system_metrics`
- Performance metrics
- Fields: id, timestamp, response_time, cpu_usage, memory_usage, requests, errors

#### `rag_documents`
- RAG system documents
- Fields: id, title, content, source, embedding_id, created_at

#### `rag_queries`
- RAG query history
- Fields: id, query, results, context, created_at

---

## 🔑 Key Features

### 1. **User Authentication**
- Email/password authentication via Supabase Auth
- Guest interview access
- Role-based access (user, company, admin)

### 2. **Interview Management**
- Create custom interviews with AI-generated questions
- Schedule interviews
- Track interview progress
- View interview history

### 3. **Voice Interview Interface**
- Real-time voice interaction via Vapi AI
- Audio recording and playback
- Timer component
- Question-by-question flow

### 4. **AI Feedback System**
- AI-powered interview feedback
- Question-by-question analysis
- Overall performance scoring
- Improvement suggestions

### 5. **CV Screening**
- CV upload and parsing
- AI-powered CV analysis
- Job matching scores
- Screening results

### 6. **Company Features**
- Company profile management
- Job posting creation
- Candidate management
- Interview scheduling
- Submission tracking

### 7. **Billing System**
- Subscription management
- Invoice generation
- Payment processing (Stripe integration)
- Usage tracking

### 8. **Admin Dashboard**
- System metrics monitoring
- Log viewing
- User management
- RAG knowledge base management
- System configuration

### 9. **RAG System**
- Document ingestion
- Vector embeddings (Pinecone)
- Semantic search
- AI-powered Q&A

---

## 🔌 API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Interviews
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/[id]` - Get interview details
- `POST /api/interviews/[id]/start` - Start interview
- `POST /api/interviews/[id]/complete` - Complete interview

### AI Services
- `POST /api/generate-questions` - Generate interview questions
- `POST /api/ai-feedback` - Get AI feedback
- `POST /api/ai-interview-feedback` - Get interview feedback
- `POST /api/extract-cv-text` - Extract text from CV
- `POST /api/screen-cv` - Screen CV against job

### Vapi Integration
- `POST /api/vapi/call` - Initiate Vapi call
- `POST /api/vapi/webhook` - Vapi webhook handler

### Admin
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/users` - List users
- `POST /api/admin/documents` - Add RAG document
- `GET /api/admin/query` - Query RAG system

### Billing
- `GET /api/billing/subscription` - Get subscription
- `POST /api/billing/subscribe` - Create subscription
- `POST /api/billing/cancel` - Cancel subscription

---

## 🔧 Configuration Files

### Environment Variables (.env)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VAPI_API_KEY=...
VAPI_PHONE_NUMBER_ID=...
OPENAI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX=...
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
```

### Next.js Configuration
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration

---

## 📦 Key Dependencies

### Frontend
- `next` - Next.js framework
- `react` - React library
- `@supabase/supabase-js` - Supabase client
- `@supabase/auth-helpers-nextjs` - Auth helpers
- `lucide-react` - Icon library
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind merge utility

### Backend
- `@supabase/supabase-js` - Supabase client
- `openai` - OpenAI API client
- `@pinecone-database/pinecone` - Pinecone client

### Python Service
- `fastapi` - FastAPI framework
- `uvicorn` - ASGI server
- `python-multipart` - File upload support
- `pydantic` - Data validation
- `openai` - OpenAI API client
- `pinecone-client` - Pinecone client

---

## 🚀 Deployment

### Vercel Deployment
- Platform: Vercel
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables configured in Vercel

### Supabase
- Database hosting
- Authentication
- Storage (CVs, audio files)
- Real-time subscriptions

### Python Service
- Deployed separately (can be on Vercel, Railway, or similar)
- Exposes REST API for document processing

---

## 📊 Data Flow

### Interview Flow
1. User creates interview → `interviews` table
2. AI generates questions → OpenAI API
3. User starts interview → Vapi AI call
4. Voice interaction → Vapi AI
5. Audio stored → Supabase Storage
6. AI analyzes responses → OpenAI API
7. Feedback generated → `interview_responses` table
8. Results displayed → Frontend

### CV Screening Flow
1. User uploads CV → Supabase Storage
2. Extract text → Python service
3. Analyze with AI → OpenAI API
4. Match with job → OpenAI API
5. Store results → `cv_screening` table
6. Display results → Frontend

### RAG System Flow
1. Admin uploads document → Python service
2. Generate embeddings → OpenAI API
3. Store in Pinecone → Vector database
4. User queries → Python service
5. Semantic search → Pinecone
6. Generate answer → OpenAI API
7. Return results → Frontend

---

## 🔐 Security Features

- Supabase Row Level Security (RLS) policies
- Service role key for admin operations
- API key validation
- CORS configuration
- Input validation
- SQL injection prevention (parameterized queries)

---

## 📈 Monitoring & Logging

- System metrics tracking (CPU, memory, response time)
- Error logging
- Request logging
- Performance monitoring
- User activity tracking

---

## 🎯 User Roles

### Candidate
- Create and take interviews
- View interview results
- Upload CV
- Apply for jobs
- Manage profile

### Company
- Create job postings
- Review candidates
- Schedule interviews
- View candidate submissions
- Manage company profile

### Admin
- Monitor system metrics
- View logs
- Manage users
- Configure RAG system
- Access all data

---

## 🐛 Known Issues & Fixes

Multiple fix files exist for various issues:
- Database structure fixes
- Foreign key constraints
- Storage policies
- Billing functions
- CV screening implementation
- Auth redirects
- Deployment issues

See individual `.md` and `.sql` files for details.

---

## 📝 Documentation Files

- `README.md` - Main project documentation
- `COMPLETE_SETUP_GUIDE.md` - Complete setup instructions
- `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment guide
- `STORAGE_SETUP_COMPLETE.md` - Storage setup guide
- `PINECONE_SETUP_GUIDE.md` - Pinecone setup guide
- `RAG_SYSTEM_README.md` - RAG system documentation
- `COMPANY_FEATURES_SUMMARY.md` - Company features overview
- Various fix and troubleshooting guides

---

## 🔄 Development Workflow

1. **Setup**: Install dependencies, configure environment variables
2. **Database**: Run SQL setup scripts in Supabase
3. **Development**: Run `npm run dev` for Next.js
4. **Python Service**: Run `uvicorn main:app --reload` for Python service
5. **Testing**: Test features locally
6. **Deployment**: Deploy to Vercel and configure environment variables

---

## 🎨 UI Components

### Shadcn/ui Components
- Button, Input, Label, Card, Dialog, AlertDialog, Badge

### Custom Components
- `AppSidebar` - Navigation sidebar
- `InterviewCard` - Interview display card
- `MicrophoneTest` - Microphone testing
- `CVUpload` - CV upload component
- `CVScreening` - CV screening display
- `TimerComponent` - Interview timer
- `SystemMetrics` - Admin metrics display
- `SystemLogs` - Admin logs display
- `RAGChat` - RAG chat interface
- `KnowledgeBase` - Knowledge base management

---

## 📊 Analytics & Metrics

Tracked metrics include:
- Response times
- CPU usage
- Memory usage
- Request counts
- Error rates
- User activity
- Interview completion rates
- CV screening success rates

---

## 🔮 Future Enhancements

Potential improvements:
- Real-time collaboration
- Advanced analytics dashboard
- Mobile app
- Video interview support
- More AI models support
- Enhanced RAG capabilities
- Multi-language support
- Advanced reporting

---

## 📞 Support & Contact

For issues or questions, refer to:
- `TROUBLESHOOTING.md` - Common issues and solutions
- `QUICK_FIX_CHECKLIST.md` - Quick fix reference
- Individual fix files for specific issues

---

**Last Updated:** 2026-02-01  
**Version:** 1.0.0
