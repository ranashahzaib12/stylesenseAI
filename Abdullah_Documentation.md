# StyleSense.AI — Knowledge Transfer Document
## Team Member: Abdullah
### Area of Responsibility: Backend API, Deployment Infrastructure, Security & DevOps

---

# TABLE OF CONTENTS

1. [Important Resources](#1-important-resources)
2. [Shared Project Snapshot](#2-shared-project-snapshot)
3. [Project Overview](#3-project-overview)
4. [Architecture Overview](#4-architecture-overview)
5. [Abdullah's Responsibilities](#5-abdullahs-responsibilities)
6. [Folder-by-Folder Breakdown](#6-folder-by-folder-breakdown)
7. [File-by-File Breakdown](#7-file-by-file-breakdown)
8. [Backend API Coverage](#8-backend-api-coverage)
9. [Middleware Architecture](#9-middleware-architecture)
10. [Deployment Infrastructure](#10-deployment-infrastructure)
11. [Security Architecture](#11-security-architecture)
12. [Environment Configuration](#12-environment-configuration)
13. [CI/CD & Build Pipeline](#13-cicd--build-pipeline)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Third-Party Infrastructure Services](#15-third-party-infrastructure-services)
16. [Common Errors & Debugging Guide](#16-common-errors--debugging-guide)
17. [Setup Guide](#17-setup-guide)
18. [Viva / FYP Preparation](#18-viva--fyp-preparation)

---

# 1. IMPORTANT RESOURCES

## Repository & Deployment Links

| Resource | URL / Location |
|---|---|
| **Frontend Deployed URL** | https://style-sense.vercel.app |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Modal Dashboard** | https://modal.com/dashboard |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/heliemugpbhlyzbagnrp |
| **Express Backend** | Runs locally on Port 8787 (or deployed separately) |
| **GitHub Repository** | Contact team lead for repo access |

## Backend Technology Documentation

| Technology | Documentation URL |
|---|---|
| Express 5 | https://expressjs.com/en/5x/api.html |
| Node.js 18 | https://nodejs.org/en/docs |
| Helmet.js (security) | https://helmetjs.github.io |
| express-rate-limit | https://github.com/express-rate-limit/express-rate-limit |
| Joi (validation) | https://joi.dev/api |
| jsonwebtoken | https://github.com/auth0/node-jsonwebtoken |
| Morgan (logging) | https://github.com/expressjs/morgan |
| Vercel Deployment | https://vercel.com/docs |
| Modal | https://modal.com/docs |

## Important Configuration Files

| File | Purpose |
|---|---|
| `backend/.env` | Backend environment variables (port, JWT, Modal URL, rate limits) |
| `backend/.env.example` | Template for backend environment |
| `.env.example` | Template for frontend environment |
| `vercel.json` | Vercel build and routing configuration |
| `backend/package.json` | Backend dependencies and scripts |
| `api/[...tryon].js` | Vercel serverless function for API proxying |

---

# 2. SHARED PROJECT SNAPSHOT

> This section is identical across all three team documents so each document can be read independently.

## Product Overview

**StyleSense.AI** is an AI-powered personal fashion assistant. It helps users discover clothing that matches their body type, style preferences, and current weather — and virtually "try on" garments using AI-generated imagery.

**Target Users:** Fashion-conscious individuals who want personalized outfit suggestions without physically visiting stores.

**Core Value Proposition:**
- Eliminate the frustration of buying clothes that don't fit or don't match personal style
- Provide a zero-effort, AI-powered virtual fitting room experience
- Give personalized, weather-aware outfit recommendations

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│              User's Browser                      │
│  React 19 + TypeScript + Tailwind CSS (Vite)    │
│  Hosted on: Vercel                               │
└──────────────┬───────────────────────────────────┘
               │ HTTPS Requests
       ┌───────▼──────────┐
       │   Vercel CDN     │  ← Static frontend files
       │   + API Routes   │  ← /api/* proxied to backend
       └───────┬──────────┘
               │
   ┌───────────▼────────────────────────────────┐
   │     Express Backend (Node.js, Port 8787)   │
   │     • Auth middleware (JWT)                │
   │     • Rate limiting & security headers     │
   │     • Try-On API proxy                     │
   └───────────┬────────────────────────────────┘
               │
   ┌───────────▼──────────────────────────────────────┐
   │  External Services                               │
   │  ├── Modal GPU (OOTDiffusion A10G)              │
   │  │    → Virtual Try-On image generation          │
   │  ├── Supabase                                    │
   │  │    → PostgreSQL database (profiles, history) │
   │  │    → Auth (email/password, Google OAuth)     │
   │  │    → Storage (try-on result images)          │
   │  ├── OpenAI GPT-4o-mini                         │
   │  │    → Chat, captions, image validation        │
   │  ├── HuggingFace Inference API                  │
   │  │    → Fallback chatbot (Mistral-7B)           │
   │  └── WeatherAPI.com                             │
   │       → Location-aware weather data             │
   └──────────────────────────────────────────────────┘
```

## Main User Journey

1. **Register / Login** → User creates account or signs in with Google (Supabase Auth)
2. **Style Quiz** → User answers questions about vibe, body type, measurements, season, occasion
3. **Dashboard** → User sees ML-recommended shirts filtered by style + weather
4. **Virtual Try-On** → User uploads photo, selects garment → AI generates composite result image
5. **Style Chatbot** → User chats with GPT-4o-mini for personalized style advice
6. **Outfit Generator** → User searches for outfit ideas with natural language
7. **Creations Panel** → User reviews past try-on results and can share them

## Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend API | Node.js, Express 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (public bucket) |
| GPU Service | Modal (A10G GPU), OOTDiffusion model |
| AI/Chat | OpenAI GPT-4o-mini, GPT-4 Vision |
| ML Engine | TF-IDF, SVD/LSA, KMeans (TypeScript) |
| Deployment | Vercel (frontend + API), Modal (GPU) |
| Testing | Jest, React Testing Library |

## Database Summary

Supabase PostgreSQL with 3 tables:
- `profiles` — User style quiz data (JSONB)
- `tryon_history` — Record of every virtual try-on attempt
- `feedback` — User ratings and comments

Row-Level Security (RLS) ensures users can only access their own data.

---

# 3. PROJECT OVERVIEW

## Abdullah's Role

Abdullah is the **Backend Engineer & DevOps specialist** for StyleSense.AI. While Usman builds the UI and Ali builds the AI/ML intelligence, Abdullah is responsible for:

1. **The Bridge:** The Express backend is the middleware between the React frontend and the Modal GPU service. Without it, the frontend would need to talk directly to Modal (exposing infrastructure URLs).

2. **The Security Layer:** All incoming requests pass through Abdullah's security middleware (rate limiting, CORS, JWT validation, input validation, security headers).

3. **The Deployment Infrastructure:** Getting the app from local development to production — Vercel configuration, environment management, build pipeline.

4. **The Proxy Architecture:** The intelligent routing layer that decides whether to use Modal GPU directly or through Express, with proper timeout handling and error recovery.

5. **Model Feedback Loop:** The feedback collection and model retraining endpoints — the mechanism for continuous improvement of the try-on quality.

## Why the Express Backend Exists

A question often asked: "If the frontend can call Modal directly (via `VITE_MODAL_URL`), why do you need an Express backend?"

**Reasons:**
1. **URL Concealment:** The Modal endpoint URL is infrastructure — exposing it publicly allows anyone to call it and incur GPU costs. The Express backend acts as a gatekeeper.
2. **Rate Limiting:** Express applies per-IP rate limits (20 try-on requests/hour). Without this, a single malicious user could exhaust your Modal budget.
3. **JWT Validation:** Express verifies Supabase JWT tokens before forwarding requests to Modal — only authenticated users can trigger GPU inference.
4. **Input Validation:** Joi schema validation on Express catches malformed payloads before they reach the GPU service.
5. **Streaming Support:** Express implements SSE (Server-Sent Events) for streaming progress updates — Modal's endpoint doesn't natively support this.
6. **Feedback & Analytics:** The feedback and training endpoints live on Express — business logic that doesn't belong in the GPU service.

---

# 4. ARCHITECTURE OVERVIEW

## Backend Architecture Pattern

The Express backend follows a **layered architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                  HTTP Request Arrives                    │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              SECURITY MIDDLEWARE LAYER                   │
│  middleware/security.js                                  │
│  ├── Helmet.js (security headers)                       │
│  ├── CORS (allowed origins)                             │
│  └── express-rate-limit (general: 120/15min)            │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              AUTHENTICATION LAYER                        │
│  middleware/jwtAuth.js                                   │
│  ├── Extract Bearer token from Authorization header     │
│  ├── Verify against JWT_SECRET or Supabase JWKS        │
│  └── Attach decoded user to req.user                    │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              ROUTING LAYER                               │
│  routes/index.js → routes/tryon.js                      │
│  ├── GET  /api/health                                   │
│  ├── POST /api/tryon/generate                           │
│  ├── POST /api/tryon/generate-stream                    │
│  ├── POST /api/tryon/detect-category                    │
│  ├── POST /api/tryon/predict                            │
│  ├── GET  /api/tryon/status                             │
│  ├── POST /api/tryon/feedback                           │
│  └── POST /api/tryon/train                              │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              SERVICE LAYER                               │
│  services/tryOnModelService.js                           │
│  ├── Try-on specific rate limiter (20/15min)            │
│  ├── Joi payload validation                             │
│  ├── Axios proxy to Modal GPU                           │
│  └── Feedback storage & model retraining logic          │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│  ├── Modal GPU (OOTDiffusion try-on)                    │
│  └── Local JSON files (feedback, model metadata)        │
└─────────────────────────────────────────────────────────┘
```

## Request Routing: Vercel vs Express

The system has two paths for API requests, depending on deployment context:

```
Browser (Production)
    │
    ▼ GET/POST /api/tryon/generate
Vercel CDN
    │
    ▼ rewrite: /api/(.*) → /api/$1
Vercel Serverless Function
    api/[...tryon].js
    │ (imports Express app)
    ▼
Express app.js (runs as Lambda, not long-running server)
    │
    ▼
modal/tryon_service.py (Modal GPU)
```

```
Browser (Local Development)
    │
    ▼ GET/POST /api/tryon/generate
Vite Dev Server (port 3000)
    │ (proxy: /api → localhost:8787)
    ▼
Express server.js (port 8787, long-running process)
    │
    ▼
modal/tryon_service.py (Modal GPU)
```

The same Express app code works in both contexts — `api/[...tryon].js` wraps it for Vercel's serverless model.

---

# 5. ABDULLAH'S RESPONSIBILITIES

Abdullah is the **Backend & Infrastructure Engineer** for this project.

## Primary Ownership Areas

### 1. Express Backend Server
Complete ownership of `backend/` directory — server entry point, Express app configuration, all routes, all middleware, services layer.

### 2. API Design & Endpoints
All 8 API endpoints are designed, documented, and maintained by Abdullah. This includes request/response schemas, error handling, HTTP status codes.

### 3. Security Middleware
CORS configuration, rate limiting, Helmet security headers, JWT authentication, input validation with Joi. All security decisions are Abdullah's.

### 4. Vercel Deployment Configuration
The `vercel.json` file, the `api/[...tryon].js` serverless wrapper, environment variable management on Vercel, and the frontend build pipeline.

### 5. Environment Management
Creating and maintaining `.env.example` files for both frontend and backend. Documenting all required environment variables. Managing API keys for deployment environments.

### 6. Modal Integration (Proxy Layer)
While Ali writes the `tryon_service.py`, Abdullah writes the Express proxy layer that calls Modal. This includes timeout handling, retry logic, error mapping.

### 7. Model Feedback Infrastructure
The `POST /api/tryon/feedback` endpoint and the `POST /api/tryon/train` endpoint — the mechanism for collecting training data and triggering model retraining.

### 8. Backend Data Files
Ownership of `backend/data/` — `outfits.js` (outfit catalog for backend), `tryon-feedback.json` (feedback storage), `tryon-model.json` (model metadata).

### 9. Documentation
`docs/Backend_Deployment_Guide.md`, `backedn-plan.md`, `docs/Project_Architecture.md` — backend-facing documentation.

---

# 6. FOLDER-BY-FOLDER BREAKDOWN

## backend/ — Express Server Root

```
backend/
├── package.json          ← Backend dependencies (Express 5, JWT, Joi, Helmet, etc.)
├── package-lock.json     ← Locked dependency versions
├── .env                  ← Actual environment (gitignored)
├── .env.example          ← Template — committed to git, shows what vars are needed
└── src/
    ├── server.js         ← Entry point: starts HTTP server, pings Modal health
    ├── app.js            ← Express app setup: middleware, routes, error handling
    ├── routes/
    │   ├── index.js      ← Router aggregator
    │   └── tryon.js      ← All try-on API endpoints (257 lines)
    ├── middleware/
    │   ├── security.js   ← Helmet, CORS, rate-limit middleware
    │   ├── auth.js       ← Optional auth (passthrough)
    │   └── jwtAuth.js    ← JWT verification middleware
    ├── services/
    │   └── tryOnModelService.js ← Try-on specific service: validation, Modal proxy, feedback
    └── data/
        ├── outfits.js           ← Outfit catalog data (backend reference)
        ├── tryon-feedback.json  ← Persistent feedback storage (JSON file)
        └── tryon-model.json     ← Model metadata and training state
```

## api/ — Vercel Serverless Functions

```
api/
└── [...tryon].js    ← Catch-all serverless function for Vercel deployment
                        Imports Express app and wraps it as a Lambda function
```

## Root-Level Deployment Files

```
vercel.json     ← Vercel build config + URL rewrites
.env.example    ← Frontend env template
.vercelignore   ← Files Vercel should not include in deployment
```

## Documentation

```
docs/
├── Project_Architecture.md      ← System architecture overview
├── Backend_Deployment_Guide.md  ← VITON-HD self-hosting guide
└── User_Guide.md                ← User-facing feature documentation

SUPABASE_SETUP.md   ← Database schema setup guide
DEPLOYMENT.md       ← Vercel deployment guide
backedn-plan.md     ← Backend architecture notes (note: typo in filename)
README.md           ← Project overview and quick start
```

---

# 7. FILE-BY-FILE BREAKDOWN

## backend/src/server.js — Entry Point

**Purpose:** The first file that runs when the Express server starts. Boots the HTTP server and sets up the Modal keep-warm ping.

**Full Content (20 lines):**
```javascript
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 8787;
const TRYON_MODAL_URL = process.env.TRYON_MODAL_URL;

// Start HTTP server
app.listen(PORT, () => {
  console.log(`StyleSense API running on port ${PORT}`);
  
  // Warn if Modal URL not configured
  if (!TRYON_MODAL_URL) {
    console.warn('WARNING: TRYON_MODAL_URL not set. Try-on service will not work.');
  }
});

// Keep Modal warm: ping every 4 minutes to prevent cold starts
const PING_INTERVAL = 4 * 60 * 1000;  // 4 minutes
if (TRYON_MODAL_URL) {
  setInterval(async () => {
    try {
      const response = await fetch(`${TRYON_MODAL_URL}/health`);
      if (response.ok) {
        console.log('[Modal Ping] Service is warm');
      }
    } catch (err) {
      console.warn('[Modal Ping] Failed:', err.message);
    }
  }, PING_INTERVAL);
}
```

**Key Decisions:**
- Port 8787 chosen because 3000 and 8000 are commonly used (3000 is Vite's dev server port)
- Modal ping interval of 4 minutes is just under the 5-minute idle timeout — keeps container warm without excessive cost
- Ping failures are logged as warnings, not errors — the app continues working even if Modal is unreachable

**Business Relevance:** The keep-warm mechanism saves users from 3-5 minute cold start waits. Without it, the first try-on after the service idles would time out for many users.

---

## backend/src/app.js — Express Application

**Purpose:** Configures the Express application with all middleware and routes. Separate from `server.js` so the same Express app can be used in both server mode and Vercel serverless mode.

**Full Content (29 lines):**
```javascript
import express from 'express';
import dotenv from 'dotenv';

// Only load .env in non-serverless environments
// (Vercel injects env vars directly, running dotenv would conflict)
if (process.env.VERCEL !== '1') {
  dotenv.config();
}

import { applySecurityMiddleware } from './middleware/security.js';
import apiRouter from './routes/index.js';

const app = express();

// Body parsing
app.use(express.json({ limit: '50mb' }));  // Large limit for base64 images
app.use(express.urlencoded({ extended: true }));

// Security middleware (Helmet, CORS, rate limiting)
applySecurityMiddleware(app);

// Root endpoint - API status check
app.get('/', (req, res) => {
  res.json({
    name: 'StyleSense API',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/api/tryon', '/api/health']
  });
});

// Mount all routes under /api
app.use('/api', apiRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

export default app;
```

**Critical Detail — `express.json({ limit: '50mb' })`:**
Virtual try-on requests include base64-encoded images. A 1080×1080 JPEG image base64-encoded is ~2-4MB. Two images (person + garment) = ~8MB. The 50MB limit provides ample headroom while preventing excessively large requests.

**Why `process.env.VERCEL !== '1'`?**
When deployed on Vercel as a serverless function, environment variables are injected by the Vercel runtime. Calling `dotenv.config()` on Vercel would attempt to read a `.env` file that doesn't exist on the Vercel filesystem, causing errors or overwriting Vercel's injected variables.

---

## backend/src/middleware/security.js — Security Middleware

**Purpose:** Applies all security-related middleware to the Express app.

**Implementation:**
```javascript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export function applySecurityMiddleware(app) {
  
  // 1. Helmet: Sets security-related HTTP headers
  app.use(helmet({
    contentSecurityPolicy: false,  // Disabled for API (would block JSON responses)
    crossOriginEmbedderPolicy: false  // Disabled for cross-origin image loading
  }));
  
  // 2. CORS: Cross-Origin Resource Sharing
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400  // Pre-flight cache: 24 hours
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));  // Handle preflight for all routes
  
  // 3. General rate limiter: 120 requests per 15 minutes per IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 120,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,   // Return RateLimit-* headers
    legacyHeaders: false
  });
  app.use(generalLimiter);
}
```

### Helmet Security Headers Explained

Helmet sets these HTTP response headers:

| Header | Value Set | Protection |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking (embedding in iframe) |
| `X-XSS-Protection` | `0` | Disables legacy XSS filter (modern browsers use CSP) |
| `Referrer-Policy` | `no-referrer` | Hides origin URL in cross-origin requests |
| `Strict-Transport-Security` | `max-age=15552000` | Forces HTTPS for 180 days |

### CORS Configuration Explained

**What is CORS?** Browsers block JavaScript from making requests to a different domain than the page was loaded from — this is the Same-Origin Policy. CORS headers tell the browser "this API allows requests from these origins."

**Our Configuration:**
- `origin: CORS_ORIGIN` — Only allows requests from the configured frontend URL
- In development: `http://localhost:3000` (the Vite dev server)
- In production: `https://style-sense.vercel.app` (the Vercel-hosted frontend)

**Why `app.options('*', cors(corsOptions))`?** Before certain requests (POST with custom headers), browsers send a "preflight" OPTIONS request. This line ensures CORS headers are returned for preflight requests on all routes.

### Rate Limiting Explained

**Two-Tier Rate Limiting:**

Tier 1 — General (applies to all endpoints):
- 120 requests per IP per 15-minute window
- Prevents general API abuse
- Configured via `RATE_LIMIT_MAX` env var

Tier 2 — Try-On specific (applies to `/api/tryon/generate`):
- 20 requests per IP per 15-minute window
- GPU compute is expensive — this limits cost exposure
- Configured via `TRYON_RATE_LIMIT_MAX` env var

**`standardHeaders: true`** — Returns these headers in responses:
```
RateLimit-Limit: 120
RateLimit-Remaining: 117
RateLimit-Reset: 2024-01-01T12:15:00.000Z
```
Frontend can read these to show "X requests remaining" to users.

---

## backend/src/middleware/jwtAuth.js — JWT Authentication

**Purpose:** Validates Supabase JWT tokens on protected endpoints.

**Implementation:**
```javascript
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // Extract Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }
  
  const token = authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // Attach user data to request
    next();              // Pass to next middleware/handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please refresh session' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}
```

**How Supabase JWT Works:**
1. When a user logs in via Supabase, Supabase issues a JWT signed with the project's `JWT_SECRET`
2. The frontend stores this token in localStorage
3. When calling protected backend endpoints, the frontend includes: `Authorization: Bearer {jwt_token}`
4. Express's `jwtAuth.js` verifies the signature using the same `JWT_SECRET`
5. If valid, `req.user` contains `{ sub: userId, email: '...', role: 'authenticated', ... }`

**The `JWT_SECRET`:** This is the Supabase project's JWT secret. Found in: Supabase Dashboard → Project Settings → API → JWT Secret. It must match between Supabase (which signs tokens) and the Express backend (which verifies them).

---

## backend/src/middleware/auth.js — Optional Auth

**Purpose:** A lighter version of auth middleware — passes through requests without authentication but logs warnings if no auth is present.

**Usage:** Applied to endpoints where auth is "nice to have" but not required (e.g., the status endpoint).

---

## backend/src/routes/index.js — Route Aggregator

**Purpose:** Imports and mounts all route modules. A single place to see all Express routes.

```javascript
import express from 'express';
import tryonRoutes from './tryon.js';

const router = express.Router();

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All try-on related routes
router.use('/tryon', tryonRoutes);

export default router;
```

---

## backend/src/routes/tryon.js — Try-On API Endpoints (257 lines)

**Purpose:** All virtual try-on related API endpoints. The most complex file in the backend.

### Endpoint 1: GET /api/tryon/status

**Purpose:** Returns current status of the try-on service.

```javascript
router.get('/status', async (req, res) => {
  const modalUrl = process.env.TRYON_MODAL_URL;
  
  if (!modalUrl) {
    return res.json({ available: false, reason: 'Modal URL not configured' });
  }
  
  try {
    const response = await fetch(`${modalUrl}/health`, { timeout: 5000 });
    const data = await response.json();
    
    res.json({
      available: true,
      modalStatus: data.status,
      gpu: data.gpu || 'unknown',
      message: 'Try-on service is ready'
    });
  } catch (err) {
    res.json({
      available: false,
      reason: 'Modal service unreachable',
      message: 'Try-on service is warming up, please wait 2-3 minutes'
    });
  }
});
```

**Frontend Usage:** Dashboard.tsx calls this on mount to show a "Service Ready" / "Warming Up" indicator before users attempt a try-on.

---

### Endpoint 2: POST /api/tryon/generate — Primary Try-On Endpoint

**Purpose:** Receives person + garment images, proxies to Modal GPU, returns result.

**This is the most critical endpoint in the backend.**

```javascript
// Try-on specific rate limiter
const tryonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.TRYON_RATE_LIMIT_MAX) || 20,  // 20 try-ons per 15 min
  message: { error: 'Too many try-on requests. Please wait before trying again.' }
});

// Joi validation schema
const tryonSchema = Joi.object({
  personImage: Joi.string().required(),   // base64 string
  garmentImage: Joi.string().required(),  // base64 string
  category: Joi.string().valid('upper_body', 'lower_body', 'dresses').default('upper_body'),
  numSteps: Joi.number().integer().min(10).max(50).default(20),
  guidanceScale: Joi.number().min(1.0).max(10.0).default(2.0),
  seed: Joi.number().integer().default(42),
  applyRefinement: Joi.boolean().default(false)
});

router.post('/generate', tryonLimiter, requireAuth, async (req, res) => {
  
  // 1. Validate request payload
  const { error, value } = tryonSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  const { personImage, garmentImage, category, numSteps, guidanceScale, seed } = value;
  const modalUrl = process.env.TRYON_MODAL_URL;
  
  if (!modalUrl) {
    return res.status(503).json({ error: 'Try-on service not configured' });
  }
  
  // 2. Proxy to Modal with 10-minute timeout
  try {
    const modalResponse = await axios.post(
      `${modalUrl}/tryon`,
      {
        person_image: personImage,
        garment_image: garmentImage,
        category,
        num_steps: numSteps,
        guidance_scale: guidanceScale,
        seed
      },
      {
        timeout: 10 * 60 * 1000,     // 10 minutes
        maxBodyLength: Infinity,       // Allow large base64 payloads
        maxContentLength: Infinity
      }
    );
    
    // 3. Return result
    res.json({
      success: true,
      resultImage: modalResponse.data.result_image,  // base64 PNG
      generationTime: modalResponse.data.generation_time
    });
    
  } catch (err) {
    // 4. Handle different error types
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Try-on generation timed out',
        message: 'The service took too long. Please try again — it may be warming up.'
      });
    }
    
    if (err.response?.status === 503) {
      return res.status(503).json({
        error: 'GPU service temporarily unavailable',
        message: 'Please try again in 2-3 minutes'
      });
    }
    
    console.error('Try-on error:', err.message);
    res.status(500).json({
      error: 'Try-on generation failed',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});
```

**Data Flow:**
```
Frontend (base64 person + garment)
    → POST /api/tryon/generate
        → tryonLimiter (rate check)
        → requireAuth (JWT check)
        → Joi validation (payload schema)
        → axios.post(modalUrl/tryon, {...}, timeout=10min)
            → Modal GPU runs OOTDiffusion
            → Returns base64 result
        → Express returns { resultImage: base64 }
    → Frontend receives result
```

---

### Endpoint 3: POST /api/tryon/generate-stream — SSE Streaming

**Purpose:** Alternative to the synchronous generate endpoint. Returns progress updates via Server-Sent Events (SSE) so the frontend can show a progress bar.

**Why SSE?** A 60-second try-on with no feedback feels broken. SSE allows sending incremental updates: "Parsing pose... Fitting garment... Generating result... Complete!"

```javascript
router.post('/generate-stream', tryonLimiter, requireAuth, async (req, res) => {
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // Disable Nginx buffering
  
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Synthetic progress stages (actual Modal doesn't emit progress)
  sendEvent({ stage: 'starting', progress: 0, message: 'Initializing try-on service...' });
  
  // Start Modal request in background
  const modalPromise = axios.post(`${process.env.TRYON_MODAL_URL}/tryon`, req.body, {
    timeout: 10 * 60 * 1000
  });
  
  // Emit synthetic progress while waiting
  const stages = [
    { delay: 3000, stage: 'pose_parsing', progress: 15, message: 'Analyzing body pose...' },
    { delay: 8000, stage: 'garment_prep', progress: 30, message: 'Preparing garment...' },
    { delay: 15000, stage: 'generating', progress: 50, message: 'Generating outfit...' },
    { delay: 30000, stage: 'generating', progress: 70, message: 'Refining details...' },
    { delay: 45000, stage: 'finalizing', progress: 90, message: 'Finalizing result...' }
  ];
  
  stages.forEach(({ delay, ...event }) => {
    setTimeout(() => {
      if (!res.headersSent || !res.writableEnded) {
        sendEvent(event);
      }
    }, delay);
  });
  
  // Wait for actual result
  try {
    const result = await modalPromise;
    sendEvent({
      stage: 'complete',
      progress: 100,
      message: 'Try-on complete!',
      resultImage: result.data.result_image
    });
  } catch (err) {
    sendEvent({ stage: 'error', message: err.message });
  }
  
  res.end();
});
```

**SSE Protocol:** The browser connects and keeps the HTTP connection open. The server sends events like:
```
data: {"stage": "pose_parsing", "progress": 15, "message": "Analyzing body pose..."}

data: {"stage": "generating", "progress": 50, "message": "Generating outfit..."}

data: {"stage": "complete", "progress": 100, "resultImage": "base64..."}
```

**Why "Synthetic" Stages?** Modal doesn't emit real progress events — it's a single HTTP request that returns after the generation is done. The Express server simulates stages with `setTimeout` to give users feedback. The timings are estimated based on typical generation durations.

---

### Endpoint 4: POST /api/tryon/detect-category

**Purpose:** Proxies garment category detection to Modal's `/detect-category` endpoint.

```javascript
router.post('/detect-category', async (req, res) => {
  const { garmentImage } = req.body;
  
  if (!garmentImage) {
    return res.status(400).json({ error: 'garmentImage is required' });
  }
  
  try {
    const response = await axios.post(
      `${process.env.TRYON_MODAL_URL}/detect-category`,
      { garment_image: garmentImage },
      { timeout: 30000 }  // 30 seconds - much shorter than try-on
    );
    
    res.json({ category: response.data.category });
    
  } catch (err) {
    // Graceful fallback if detection fails
    console.warn('Category detection failed, defaulting to upper_body:', err.message);
    res.json({ category: 'upper_body' });  // Safe default
  }
});
```

**Note The Fallback:** If category detection fails (Modal unreachable, ONNX error), the endpoint returns 'upper_body' as a default. This is intentional — an incorrect category produces a weird try-on result, but a failed category detection shouldn't block the entire try-on.

---

### Endpoint 5: POST /api/tryon/predict — Fit Prediction

**Purpose:** Uses the try-on model metadata to predict how a garment will fit based on the user's measurements.

```javascript
router.post('/predict', requireAuth, async (req, res) => {
  const { measurements, garmentId } = req.body;
  
  // Load model metadata
  const modelData = JSON.parse(fs.readFileSync('./data/tryon-model.json'));
  
  // Simple fit calculation (could be enhanced with ML)
  const fitScore = calculateFitScore(measurements, garmentId, modelData);
  
  res.json({
    garmentId,
    fitScore,          // 0-100
    recommendation: getFitRecommendation(fitScore),  // 'Great fit', 'Size up', etc.
    confidence: 0.75
  });
});
```

---

### Endpoint 6: POST /api/tryon/feedback — Feedback Collection

**Purpose:** Collects user ratings and comments about try-on results. Stores them for model improvement.

```javascript
const feedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).optional(),
  tryonId: Joi.string().uuid().required(),
  category: Joi.string().valid('upper_body', 'lower_body', 'dresses').required()
});

router.post('/feedback', requireAuth, async (req, res) => {
  
  const { error, value } = feedbackSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  // Append feedback to JSON file
  const feedbackPath = './data/tryon-feedback.json';
  const existingFeedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
  
  existingFeedback.push({
    ...value,
    userId: req.user.sub,  // From JWT
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(feedbackPath, JSON.stringify(existingFeedback, null, 2));
  
  res.json({ success: true, message: 'Feedback recorded' });
});
```

**Feedback Data Structure in `tryon-feedback.json`:**
```json
[
  {
    "tryonId": "uuid-here",
    "rating": 4,
    "comment": "Looks realistic but shirt color slightly off",
    "category": "upper_body",
    "userId": "user-uuid-here",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### Endpoint 7: POST /api/tryon/train — Model Retraining (Admin)

**Purpose:** Triggers model retraining using collected feedback. Admin-only endpoint.

```javascript
const ML_ADMIN_KEY = process.env.ML_ADMIN_KEY;

router.post('/train', async (req, res) => {
  
  // Admin authentication via API key (not JWT)
  const providedKey = req.headers['x-admin-key'];
  if (!ML_ADMIN_KEY || providedKey !== ML_ADMIN_KEY) {
    return res.status(403).json({ error: 'Unauthorized. Admin key required.' });
  }
  
  // Load feedback data
  const feedback = JSON.parse(fs.readFileSync('./data/tryon-feedback.json'));
  
  if (feedback.length < 10) {
    return res.status(400).json({
      error: 'Insufficient feedback data',
      message: `${feedback.length} feedback entries available. Need at least 10.`
    });
  }
  
  // Trigger retraining (could call a Python script or ML pipeline)
  const trainingResult = await tryOnModelService.triggerRetraining(feedback);
  
  // Update model metadata
  const modelData = JSON.parse(fs.readFileSync('./data/tryon-model.json'));
  modelData.lastTrainingDate = new Date().toISOString();
  modelData.datasetSize = feedback.length;
  modelData.version = (parseFloat(modelData.version) + 0.1).toFixed(1);
  fs.writeFileSync('./data/tryon-model.json', JSON.stringify(modelData, null, 2));
  
  res.json({
    success: true,
    message: 'Retraining initiated',
    newVersion: modelData.version,
    datasetSize: feedback.length
  });
});
```

---

## backend/src/services/tryOnModelService.js — Service Layer

**Purpose:** Encapsulates business logic for the try-on model — validation helpers, modal proxy abstraction, feedback analysis, and retraining triggers.

**Key Functions:**

### `calculateFitScore(measurements, garmentId, modelData)`
Takes user measurements (from quiz: bust, waist, hips, height) and garment specifications, returns a 0-100 fit score.

### `getFitRecommendation(score)`
Converts numeric score to human-readable recommendation:
- 80-100: "Great fit — this is your size"
- 60-79: "Good fit — may be slightly snug"
- 40-59: "Consider sizing up"
- 0-39: "May not fit well — check size guide"

### `triggerRetraining(feedbackData)`
Calls the Modal service's (or a separate training pipeline's) retraining endpoint. Currently stores training job metadata and could trigger an async Python training script.

---

## backend/data/ — Backend Data Files

### outfits.js — Outfit Catalog

**Purpose:** Server-side copy of the outfit catalog. Used when the backend needs to reference product data (e.g., in the predict endpoint to get garment measurements).

**Structure:**
```javascript
export const outfits = [
  {
    id: 'shirt-001',
    name: 'Classic Blue Oxford',
    category: 'upper_body',
    measurements: {
      chest: { S: 36, M: 40, L: 44, XL: 48 },
      length: { S: 28, M: 29, L: 30, XL: 31 }
    }
  },
  // ... 29 more
];
```

### tryon-feedback.json — Feedback Storage

**Purpose:** Persistent storage for user feedback about try-on quality.

**Current Implementation:** Simple JSON file. In production, this should be a database table (consider adding to Supabase).

**Trade-off:** JSON file is simple and requires no additional infrastructure. For a team of researchers analyzing feedback, a queryable database would be better. For FYP-scale, JSON file is acceptable.

### tryon-model.json — Model Metadata

**Purpose:** Tracks the current state of the try-on model.

**Structure:**
```json
{
  "version": "1.2",
  "lastTrainingDate": "2024-01-10T08:00:00.000Z",
  "datasetSize": 156,
  "metrics": {
    "averageRating": 3.8,
    "successRate": 0.94
  },
  "currentModelPath": "levihsu/OOTDiffusion"
}
```

---

## api/[...tryon].js — Vercel Serverless Wrapper

**Purpose:** Wraps the Express app as a Vercel Serverless Function. This file is the bridge between Vercel's function invocation model and Express's middleware model.

**Content:**
```javascript
import app from '../backend/src/app.js';

// Vercel invokes this handler for all /api/* requests
export default function handler(req, res) {
  // Delegate to Express app
  app(req, res);
}
```

**How Vercel Serverless Functions Work:**
- Vercel creates a new Node.js process for each function file
- Each HTTP request calls the `export default function handler`
- The process may be reused for subsequent requests (warm) or destroyed (cold start)
- There is no persistent state between requests (unlike the long-running Express server locally)

**Important Implication:** Because Vercel functions are stateless, the `setInterval` Modal ping in `server.js` does NOT work on Vercel. The ping is only active when running the full Express server locally or on a traditional server.

---

## vercel.json — Vercel Deployment Configuration

**Purpose:** Configures how Vercel builds and serves the application.

**Full Content:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Detailed Explanation of Rewrites:**

**Rewrite 1:** `"/api/(.*)" → "/api/$1"`
- Captures any `/api/something` path
- Routes it to the `/api/` directory (Vercel Serverless Functions)
- `[...tryon].js` in the `api/` folder is a catch-all that handles all `/api/*` paths
- This enables the Express backend to run as serverless functions on Vercel

**Rewrite 2:** `"/(.*)" → "/index.html"`
- Catches everything else (any non-api URL)
- Returns the React `index.html` shell
- React Router then reads `window.location.pathname` and renders the correct component
- Without this: visiting `https://stylesense.ai/dashboard` directly → 404 Not Found

**`buildCommand: "npm run build"`** — Runs `tsc && vite build` to:
1. Type-check TypeScript
2. Bundle all React/TypeScript to optimized JavaScript
3. Place output in `dist/`

**`outputDirectory: "dist"`** — Tells Vercel where to find the static files to serve.

---

## .vercelignore — Vercel Build Exclusions

**Purpose:** Like `.gitignore` but for Vercel builds. Files listed here are not uploaded to Vercel's deployment.

**Typical Contents:**
```
node_modules
backend/node_modules
*.pkl
outfit_finder.ipynb
__pycache__
*.pyc
```

**Why Exclude Backend `node_modules`?** Vercel installs its own dependencies using the `buildCommand`. Pre-built `node_modules` from local development would conflict and add unnecessary size to the deployment.

**Why Exclude `.pkl` and `.ipynb`?** These are ML development artifacts. They're large files not needed for the web app deployment.

---

## backend/.env.example — Backend Environment Template

**Purpose:** Documents all required environment variables for the backend. This file IS committed to git (it's a template with no real secrets).

**Content:**
```bash
# Server Configuration
PORT=8787

# CORS: Frontend URL(s) allowed to call this API
# Dev: http://localhost:3000, Prod: https://your-app.vercel.app
CORS_ORIGIN=http://localhost:3000

# Modal GPU Service
TRYON_MODAL_URL=https://your-org-stylesense-tryon-endpoint.modal.run
TRYON_API_KEY=optional-api-key-for-modal

# Rate Limiting
RATE_LIMIT_MAX=120          # General: requests per IP per 15min window
TRYON_RATE_LIMIT_MAX=20     # Try-on: requests per IP per 15min window

# Authentication
JWT_SECRET=your-supabase-jwt-secret-from-dashboard
# Found at: Supabase Dashboard → Project Settings → API → JWT Secret

# ML Admin
ML_ADMIN_KEY=a-strong-random-string-for-admin-endpoints
# Used for: POST /api/tryon/train (model retraining trigger)
```

---

## Root .env.example — Frontend Environment Template

**Content:**
```bash
# Required: OpenAI API key for chatbot, image validation, captions
OPENAI_API_KEY=sk-...

# Optional: Direct Modal GPU endpoint (bypasses Express proxy)
# If set, frontend calls Modal directly (faster but exposes Modal URL)
VITE_MODAL_URL=https://your-modal-endpoint.modal.run

# Optional: Express backend URL (defaults to /api via Vite proxy)
VITE_BACKEND_URL=http://localhost:8787
```

---

## Documentation Files

### docs/Project_Architecture.md

**What It Contains:**
- Technology stack overview
- Folder structure explanation
- Data flow diagrams
- API endpoint summary
- Testing approach
- Environment variable documentation

### docs/Backend_Deployment_Guide.md

**What It Contains:**
- Step-by-step guide for self-hosting VITON-HD (alternative to OOTDiffusion)
- Google Colab setup for GPU access during development
- HuggingFace Spaces deployment with Gradio
- Ngrok tunneling for local development with public URLs

### DEPLOYMENT.md

**What It Contains:**
- Vercel deployment checklist
- Environment variable configuration on Vercel
- Custom domain setup
- Debugging common deployment issues

### SUPABASE_SETUP.md

**What It Contains:**
- 9-step SQL setup guide
- Complete SQL scripts for tables, RLS policies, storage setup
- Trigger for auto-creating user profiles

---

# 8. BACKEND API COVERAGE

## Complete API Endpoint Reference

| Method | Path | Auth | Rate Limit | Purpose |
|---|---|---|---|---|
| GET | `/api/health` | None | General (120/15min) | Service health check |
| GET | `/api/tryon/status` | None | General | Modal GPU service status |
| POST | `/api/tryon/generate` | JWT Required | Try-on (20/15min) | Sync try-on generation |
| POST | `/api/tryon/generate-stream` | JWT Required | Try-on | SSE streaming try-on |
| POST | `/api/tryon/detect-category` | None | General | Garment category detection |
| POST | `/api/tryon/predict` | JWT Required | General | Fit prediction |
| POST | `/api/tryon/feedback` | JWT Required | General | Submit feedback |
| POST | `/api/tryon/train` | Admin Key | General | Trigger retraining |

## Request/Response Schemas

### POST /api/tryon/generate

**Request:**
```json
{
  "personImage": "data:image/jpeg;base64,/9j/4AAQ...",
  "garmentImage": "data:image/png;base64,iVBORw0K...",
  "category": "upper_body",
  "numSteps": 20,
  "guidanceScale": 2.0,
  "seed": 42,
  "applyRefinement": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "resultImage": "data:image/png;base64,iVBORw0K...",
  "generationTime": 47.3
}
```

**Error Responses:**
```json
// 400 Bad Request (validation)
{ "error": "\"category\" must be one of [upper_body, lower_body, dresses]" }

// 401 Unauthorized
{ "error": "Missing authentication token" }

// 429 Too Many Requests
{ "error": "Too many try-on requests. Please wait before trying again." }

// 503 Service Unavailable
{ "error": "GPU service temporarily unavailable", "message": "Please try again in 2-3 minutes" }

// 504 Gateway Timeout
{ "error": "Try-on generation timed out", "message": "..." }
```

### POST /api/tryon/feedback

**Request:**
```json
{
  "rating": 4,
  "comment": "Looks very realistic!",
  "tryonId": "550e8400-e29b-41d4-a716-446655440000",
  "category": "upper_body"
}
```

**Success Response (200):**
```json
{ "success": true, "message": "Feedback recorded" }
```

---

# 9. MIDDLEWARE ARCHITECTURE

## Middleware Execution Order

Every request flows through middleware in this exact order:

```
1. express.json({ limit: '50mb' })    → Parse JSON body, enforce size limit
2. express.urlencoded({ extended: true }) → Parse form data
3. helmet()                           → Set security HTTP headers
4. cors(corsOptions)                  → Add CORS headers, handle preflight
5. generalRateLimiter                 → Check/update IP request counter
6. [Route-specific middleware] ←
   └── tryonRateLimiter               → Check try-on request counter (on /generate)
   └── requireAuth                    → Verify JWT token (on protected routes)
7. Route handler                      → Business logic
8. Error handler                      → Catch unhandled errors
```

## Why Middleware Order Matters

- **JSON parser before routes:** Routes need `req.body` to be populated before they can read it
- **Security before routes:** Security headers must be set before any response is sent
- **Rate limiter before auth:** We want to count even invalid/unauthenticated requests toward the rate limit. Otherwise, a script that sends bad auth tokens wouldn't be rate-limited.
- **Auth before route handler:** The handler must have `req.user` available. If auth fails, the handler never runs.
- **Error handler last:** Must be registered after all routes so it catches errors from any route.

## Joi Validation Strategy

Rather than manual `if (!req.body.field)` checks in every handler, Joi provides declarative schema validation:

```javascript
const schema = Joi.object({
  personImage: Joi.string()
    .required()
    .custom((value, helpers) => {
      // Check it's a valid base64 string
      if (!value.match(/^data:image\/[a-z]+;base64,/)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  category: Joi.string()
    .valid('upper_body', 'lower_body', 'dresses')
    .default('upper_body'),
  numSteps: Joi.number()
    .integer()
    .min(10)
    .max(50)
    .default(20),
});

const { error, value } = schema.validate(req.body, { abortEarly: true });
if (error) return res.status(400).json({ error: error.details[0].message });
// `value` now has defaults applied and is validated
```

**Benefits:**
- Descriptive error messages (tells user WHAT is wrong)
- Automatic default values (`numSteps` defaults to 20 if not provided)
- Single source of truth for what each endpoint accepts
- Easy to extend (add a new field = one line in the schema)

---

# 10. DEPLOYMENT INFRASTRUCTURE

## Vercel Deployment

### What Vercel Does

Vercel is a cloud platform specialized for frontend and serverless deployments. It handles:
1. **Build:** Runs `npm run build` → `tsc && vite build` → output in `dist/`
2. **CDN:** Distributes `dist/` files to edge nodes worldwide
3. **Serverless Functions:** Runs the `api/[...tryon].js` function on-demand
4. **HTTPS:** Auto-provisions SSL certificates
5. **Preview Deployments:** Every PR gets a unique preview URL for testing

### Deployment Trigger

```
Developer pushes to main branch on GitHub
    ↓
GitHub webhook notifies Vercel
    ↓
Vercel pulls latest code
    ↓
Runs: npm install && npm run build
    ↓
Builds: dist/ (frontend) + api/ (serverless functions)
    ↓
Deploys to global CDN (70+ edge locations)
    ↓
Live at: https://style-sense.vercel.app
```

### Environment Variables on Vercel

Set in: Vercel Dashboard → Project → Settings → Environment Variables

```
OPENAI_API_KEY        → Used by frontend code (via Vite bundle)
VITE_MODAL_URL        → Optional: direct Modal endpoint for frontend
VITE_BACKEND_URL      → Optional: custom backend URL
```

**Note:** Variables prefixed with `VITE_` are exposed to the frontend bundle. Variables without `VITE_` prefix are only available in serverless functions (not in browser code).

### Vercel Edge Network

Vercel serves static files from 70+ edge locations worldwide. When a user in Dubai opens StyleSense.AI:
1. Their browser connects to the nearest Vercel edge node (e.g., Dubai)
2. The edge node serves cached `dist/index.html` and JS files
3. Only API calls (`/api/*`) go to the central serverless function

This means global users experience fast page loads regardless of where the original server is.

### Serverless Function Cold Starts on Vercel

Unlike the long-running Express server locally, Vercel serverless functions:
- Start fresh for each request (or reuse a warm container if available)
- Have no persistent `setInterval` (the Modal ping doesn't work here)
- Maximum execution time: 60 seconds for Hobby, 300 seconds for Pro

**Impact:** The 10-minute timeout for try-on generation will ALWAYS fail on Vercel Hobby tier (60-second limit). This means:
- **Option A:** Upgrade to Vercel Pro ($20/month) for 300-second function limit
- **Option B:** Use a separate backend server (not Vercel functions) for the try-on proxy
- **Option C:** Frontend calls Modal directly via `VITE_MODAL_URL` (bypasses Vercel functions entirely)

**Current Architecture:** The `VITE_MODAL_URL` option (Option C) is the primary path in production. The Express proxy is used for development and for endpoints with shorter timeouts (status, feedback, detect-category).

## Modal GPU Service Deployment

### What Modal Does

Modal is a cloud platform for GPU compute. Unlike Vercel (stateless web requests), Modal:
- Runs persistent Python containers on GPU hardware
- Scales from 0 to N containers based on demand
- Provides persistent Volume storage for model weights
- Handles all GPU driver setup, CUDA, Python environment

### Modal Deployment Process

```bash
# 1. Install Modal
pip install modal

# 2. Authenticate with Modal
modal token new
# → Browser opens → Sign in → Token saved locally

# 3. Deploy the service
cd modal
modal deploy tryon_service.py
# → Modal reads the Python file
# → Builds Docker image with all dependencies
# → Uploads to Modal infrastructure
# → Starts GPU container
# → Prints endpoint URL
# Example output:
# ✓ Created deployment stylesense-tryon
# Web endpoint URL: https://myorg-stylesense-tryon-tryon-endpoint.modal.run
```

### Modal Volume (Persistent Storage)

```python
# In tryon_service.py:
volume = modal.Volume.from_name("stylesense-ootd-cache", create_if_missing=True)

@app.function(
    volumes={"/cache": volume}  # Mount volume at /cache inside container
)
def tryon():
    # Models downloaded to /cache on first run, persist between runs
    pass
```

**Why Volume?** OOTDiffusion model weights are ~8GB. Without a Volume, every cold start would re-download 8GB from HuggingFace — taking 5-10 minutes. With Volume, weights are downloaded once and cached forever (or until manually deleted).

**Volume Operations:**
```bash
# List volumes
modal volume list

# Inspect volume contents
modal volume ls stylesense-ootd-cache

# Delete volume (forces model re-download on next start)
modal volume rm stylesense-ootd-cache
```

### Modal Function Configuration

```python
@app.function(
    gpu="A10G",              # NVIDIA A10G (24GB VRAM)
    timeout=1800,            # 30-minute maximum per request
    volumes={"/cache": volume},
    image=modal_image,       # Custom Docker image
    allow_concurrent_inputs=5,  # Allow 5 concurrent try-ons per container
    container_idle_timeout=300  # Keep container alive 5 min after last request
)
```

**`allow_concurrent_inputs=5`:** Without this, each container handles one request at a time. With it, one A10G container can handle 5 requests simultaneously (if they fit in 24GB VRAM). For try-on at batch_size=1, this is feasible.

**`container_idle_timeout=300`:** Container stays alive for 5 minutes after last request. Our Express ping every 4 minutes keeps this from expiring.

### Modal Image (Docker)

```python
# In tryon_service.py:
modal_image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install([
        "torch==2.0.1",
        "torchvision==0.15.2",
        "diffusers>=0.24.0",
        "transformers>=4.36.2",
        "onnxruntime>=1.17.0",
        "Pillow",
        "numpy",
        "opencv-python-headless",
        "fastapi",
        "uvicorn"
    ])
)
```

This defines the Docker image that Modal builds and runs on the GPU. It's equivalent to a `Dockerfile` but written as Python code.

---

# 11. SECURITY ARCHITECTURE

## Defense in Depth

The security model uses multiple independent layers. An attacker would need to bypass ALL of them:

```
Layer 1: CORS → Only requests from known frontend domains pass
Layer 2: Rate Limiting → Limits requests per IP (prevents DoS, scraping)
Layer 3: JWT Authentication → Only valid Supabase sessions proceed
Layer 4: Input Validation (Joi) → Malformed payloads rejected before processing
Layer 5: Database RLS → Even if data is accessed, only own data is visible
Layer 6: Storage Policies → Users can only write to their own folder
```

## CORS Security

**What It Prevents:** CSRF (Cross-Site Request Forgery) attacks where a malicious website makes API calls pretending to be the user.

**Configuration:**
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
```

In production: `CORS_ORIGIN=https://style-sense.vercel.app`

Only requests from `https://style-sense.vercel.app` are allowed. If a phishing site tries to call the API, the browser's CORS check blocks it.

**Note:** CORS is a browser enforcement mechanism — it doesn't protect server-to-server calls (like curl). For those, JWT authentication is the protection.

## Rate Limiting as DoS Protection

Without rate limiting:
- Attacker scripts 1000 concurrent try-on requests
- Each try-on costs $0.02-0.05 on Modal
- Cost: $20-50 from one attacker in minutes

With rate limiting:
- Per IP: 20 try-on requests per 15 minutes
- Same attacker: max 20 × $0.05 = $1 per 15 minutes
- Massively limits financial exposure

**Limitations:** IP-based rate limiting can be bypassed with rotating IPs (VPNs, Tor). For stronger protection, add per-user-account rate limiting (check `req.user.sub` after auth).

## JWT Security Model

**What JWTs Are:** JSON Web Tokens are signed statements about identity. Format:
```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiJ9  ← Header: algorithm
.eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0=  ← Payload: claims
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature: HMAC-SHA256
```

**Why JWTs Are Secure:** The signature is computed using `HMAC-SHA256(header + payload, JWT_SECRET)`. Anyone can read the payload (it's base64, not encrypted), but they cannot forge a valid signature without the `JWT_SECRET`. If an attacker changes the payload (e.g., changes `userId`), the signature becomes invalid and the server rejects it.

**Expiry:** Supabase JWTs expire after 1 hour. The Supabase client automatically refreshes them before expiry. Expired tokens produce a 401 response.

## Input Validation as Injection Prevention

Joi validation prevents:

1. **Oversized payloads:** `Joi.string().max(5000000)` prevents base64 images > 5MB
2. **Type confusion:** `Joi.number().integer()` prevents string injection in numeric fields
3. **Enum injection:** `Joi.string().valid('upper_body', 'lower_body', 'dresses')` prevents arbitrary category strings from reaching the Modal service
4. **NoSQL injection:** N/A (we use SQL with parameterized queries via Supabase SDK)

---

# 12. ENVIRONMENT CONFIGURATION

## Complete Environment Variable Reference

### Backend Environment (backend/.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | 8787 | HTTP server port |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Allowed frontend origin |
| `TRYON_MODAL_URL` | Yes (for try-on) | - | Modal GPU endpoint URL |
| `TRYON_API_KEY` | No | - | Optional Modal auth key |
| `RATE_LIMIT_MAX` | No | 120 | General requests per IP per 15min |
| `TRYON_RATE_LIMIT_MAX` | No | 20 | Try-on requests per IP per 15min |
| `JWT_SECRET` | Yes (for auth) | - | Supabase JWT signing secret |
| `ML_ADMIN_KEY` | Yes (for /train) | - | Admin key for retraining endpoint |

### Frontend Environment (.env.local)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key (chatbot, captions) |
| `VITE_MODAL_URL` | No | - | Direct Modal endpoint (bypasses Express) |
| `VITE_BACKEND_URL` | No | Vite proxy | Backend URL override |

## Environment Variable Security

### Never Commit to Git

These should NEVER appear in any committed file:
- `OPENAI_API_KEY` — Would expose your OpenAI billing
- `JWT_SECRET` — Would allow forging authentication tokens
- `ML_ADMIN_KEY` — Would allow unauthorized model retraining
- `TRYON_API_KEY` — Would allow unauthorized GPU access

**How to Check:** Run `git log --all --full-history -- '*.env'` to verify no `.env` files were accidentally committed.

### `.gitignore` Entries for Environment Files

```
# In .gitignore
.env
.env.local
.env.*.local
backend/.env
!.env.example
!backend/.env.example
```

The `!` prefix means "don't ignore this file" — `.env.example` files ARE committed because they're just templates with no real secrets.

## Environment Across Deployments

| Context | Frontend Env | Backend Env |
|---|---|---|
| Local Dev | `.env.local` | `backend/.env` |
| Vercel Preview | Vercel Dashboard → Project → Settings → Environment (Preview) | Same |
| Vercel Production | Vercel Dashboard → Project → Settings → Environment (Production) | Same |

**Different Values for Preview vs Production:**
- `CORS_ORIGIN`: Preview = `https://style-sense-git-feature-branch.vercel.app`, Production = `https://style-sense.vercel.app`

---

# 13. CI/CD & BUILD PIPELINE

## Build Pipeline

The project uses Git-based deployment (no explicit CI/CD pipeline yet):

```
Local Development
    → npm run dev (Vite dev server + Express backend)

Building
    → npm run build
       → tsc (TypeScript type checking)
       → vite build (bundle + optimize)
       → Output: dist/

Testing
    → npm test
       → jest (unit + integration tests)

Deployment
    → git push origin main
       → Vercel webhook triggered
       → Vercel runs: npm install && npm run build
       → If build succeeds: deploy to production CDN
       → If build fails: no deployment, previous version stays live
```

## Test Pipeline

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern="AuthContext"

# Watch mode (re-run on file changes)
npm test -- --watch
```

**Test Files:**
- `__tests__/AppContext.test.tsx` — State management tests
- `__tests__/AuthContext.test.tsx` — Authentication flow tests
- `__tests__/Dashboard.test.tsx` — Dashboard component rendering
- `__tests__/CreationsPanel.test.tsx` — Job panel tests
- `__tests__/Onboarding.test.tsx` — Quiz flow tests
- `__tests__/apiService.test.ts` — API call mocking tests
- `__tests__/geminiService.test.ts` — OpenAI call mocking tests
- `__tests__/useWeather.test.ts` — Weather hook tests
- `__tests__/integration/TryOnFlow.test.tsx` — End-to-end try-on simulation

## Potential CI/CD Enhancement (Not Currently Implemented)

A production CI/CD pipeline would add:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npm test
      - run: npm run build
  
  deploy:
    needs: test  # Only deploy if tests pass
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

This would prevent broken code from reaching production. Currently Vercel deploys automatically on push (no test gate).

---

# 14. MONITORING & OBSERVABILITY

## Current Monitoring

**Morgan HTTP Logger (backend):**
```javascript
app.use(morgan('combined'));  // Logs: IP, method, path, status, response time
```

Example log output:
```
192.168.1.1 - - [15/Jan/2024:10:30:00 +0000] "POST /api/tryon/generate HTTP/1.1" 200 2048 45678ms
```

**Modal Dashboard:**
- Function invocation count
- Average execution time
- Error rate
- GPU memory usage
- Container cold/warm start distribution

**Vercel Dashboard:**
- Request count per endpoint
- Response times (p50, p95, p99)
- Error rate
- Deployment history

**Supabase Dashboard:**
- Database query performance
- Auth sign-in events
- Storage usage
- API request count

## Logging Strategy

**Current:** Console.log/warn/error to stdout (captured by Vercel/Modal's built-in log aggregation)

**What Gets Logged:**
- Server startup message (port number)
- Modal ping success/failure
- Try-on errors with error messages
- Unhandled exceptions

**What Should Be Added (Production Enhancement):**
- Request tracing (correlation IDs to track one user's flow across all logs)
- Performance metrics (try-on generation time per request)
- Error rate alerts (email/Slack when error rate exceeds threshold)

---

# 15. THIRD-PARTY INFRASTRUCTURE SERVICES

## Vercel

| Property | Detail |
|---|---|
| Plan | Hobby (free) or Pro ($20/month) |
| Limits (Hobby) | 100GB bandwidth, 100 deployments/day, 60-second function timeout |
| Limits (Pro) | 1TB bandwidth, unlimited deployments, 300-second function timeout |
| Regions | Global CDN (70+ edge locations) |
| Monitoring | Built-in dashboard at vercel.com/dashboard |
| Custom Domain | Add in Project Settings → Domains |

**Critical Hobby vs Pro Difference:** 60-second function timeout on Hobby tier. OOTDiffusion takes 60+ seconds. Therefore:
- **Hobby:** Try-on must go directly from frontend to Modal (`VITE_MODAL_URL`), bypassing Vercel functions
- **Pro:** Try-on can route through Vercel functions (300-second limit)

## Modal

| Property | Detail |
|---|---|
| Billing | Pay per GPU second ($0.00031/second for A10G = ~$1.12/hour) |
| A10G GPU | 24GB VRAM, NVIDIA A10G |
| Free Tier | $30/month free credits for new accounts |
| Region | US-based (east/west) |
| Scaling | Auto-scales to 100+ containers by default |
| Volume | $0.20/GB/month for persistent storage |

## Supabase

| Property | Detail |
|---|---|
| Plan | Free tier |
| Free Limits | 500MB database, 1GB storage, 50K monthly active users, 2M API requests |
| Region | Auto-selected on project creation |
| Connection Pooling | PgBouncer on paid plans (needed for 100+ concurrent connections) |
| Backups | Daily backups on paid plans, 7-day retention |

---

# 16. COMMON ERRORS & DEBUGGING GUIDE

## Backend Startup Errors

### "Port 8787 already in use"
**Cause:** Another process is using port 8787
**Fix:**
```bash
# Windows
netstat -ano | findstr :8787
taskkill /PID <pid> /F

# Linux/Mac
lsof -ti:8787 | xargs kill -9
```
Or change `PORT=8788` in `backend/.env`.

### "Cannot find module './app.js'"
**Cause:** Running `server.js` directly with `node server.js` without proper ESM support
**Fix:** Use `npm start` (which uses `node --experimental-modules` or correct package.json "type": "module")

### ".env not found"
**Cause:** Running backend from wrong directory
**Fix:** Always run `npm start` from inside the `backend/` directory, not from the project root.

## API Errors

### 400 Bad Request: "personImage is required"
**Cause:** Frontend not including the base64 image in the request body
**Fix:** Check `apiService.performVitonHDTryOn()` — ensure it's sending `personImage` (camelCase), not `person_image` (snake_case). Express backend expects camelCase; Modal expects snake_case.

### 401 Unauthorized: "Invalid authentication token"
**Cause 1:** Frontend not sending the Supabase JWT in the Authorization header
**Fix:** Check `apiService.ts` — ensure it reads `supabase.auth.getSession()` and includes `session.access_token` as Bearer token.

**Cause 2:** `JWT_SECRET` in backend doesn't match Supabase project's JWT secret
**Fix:** Check Supabase Dashboard → Project Settings → API → JWT Secret. Copy exact value to `backend/.env`.

### 429 Too Many Requests
**Cause:** Rate limit exceeded (20 try-on requests per 15 minutes per IP)
**Fix for Testing:** Increase `TRYON_RATE_LIMIT_MAX=100` in backend/.env for development.
**Fix for Production:** Implement user-account-based rate limiting instead of IP-based.

### 503 Service Unavailable: "Modal service unreachable"
**Cause 1:** `TRYON_MODAL_URL` not configured in backend/.env
**Fix:** Set `TRYON_MODAL_URL` to your Modal endpoint URL.

**Cause 2:** Modal service crashed
**Fix:** Check Modal dashboard → App logs → look for Python exceptions. Redeploy: `modal deploy modal/tryon_service.py`

### 504 Gateway Timeout
**Cause:** Modal took longer than 10 minutes
**Scenario:** Modal cold start (3-5 min) + generation (60s) = could exceed 10 min if cold
**Fix:** Check Modal dashboard for container status. If container recycled, it's cold. Users need to wait and retry. The keep-warm ping prevents this in normal operation.

## Vercel Deployment Errors

### "Build failed: TypeScript errors"
**Cause:** TypeScript type errors prevent `tsc` from succeeding
**Fix:** Run `npm run build` locally first. Fix all TypeScript errors before pushing.
**Shortcut:** `npx tsc --noEmit` runs type checking without building.

### "Function timeout exceeded"
**Cause:** Vercel Hobby tier has 60-second function timeout. Try-on takes longer.
**Fix:** Use `VITE_MODAL_URL` in frontend env so try-on bypasses Vercel functions.

### "Module not found: 'backend/src/app.js'"
**Cause:** `api/[...tryon].js` imports from `'../backend/src/app.js'` but Vercel build didn't include backend files
**Fix:** Check `.vercelignore` — ensure `backend/` is NOT listed there. Vercel needs to include backend source in the function bundle.

### Environment variable not available in browser
**Cause:** Variable name doesn't start with `VITE_`
**Fix:** Rename `OPENAI_API_KEY` to `VITE_OPENAI_API_KEY` in `.env.local` and update `config.ts` to use `import.meta.env.VITE_OPENAI_API_KEY`.

## CORS Errors (Browser Console)

### "CORS policy: No 'Access-Control-Allow-Origin' header"
**Cause 1:** Backend is not running
**Fix:** Start Express backend: `cd backend && npm start`

**Cause 2:** `CORS_ORIGIN` in backend/.env doesn't match the frontend's origin
**Example Error:** Frontend at `http://localhost:3001` but `CORS_ORIGIN=http://localhost:3000`
**Fix:** Match exactly, including port number. Or set `CORS_ORIGIN=*` for development (not production).

**Cause 3:** Backend throws an error before CORS headers are set
**Fix:** Check backend console for errors. The error response might not include CORS headers if it happens before the cors() middleware runs.

---

# 17. SETUP GUIDE

## Complete Backend Setup

### Prerequisites
- Node.js 18+
- npm 9+
- A Supabase project (for JWT secret)
- A Modal account (for GPU service)

### Step 1: Install Dependencies
```bash
cd d:\Clients-ZeRaan\Style-Sense-Main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```bash
PORT=8787
CORS_ORIGIN=http://localhost:3000
TRYON_MODAL_URL=https://your-modal-url.modal.run
JWT_SECRET=your-jwt-secret-from-supabase-dashboard
ML_ADMIN_KEY=any-strong-random-string-for-admin
RATE_LIMIT_MAX=120
TRYON_RATE_LIMIT_MAX=20
```

**How to find JWT_SECRET:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy the "JWT Secret" value

### Step 3: Configure Frontend Environment
```bash
# In project root
cp .env.example .env.local
```

Edit `.env.local`:
```bash
OPENAI_API_KEY=sk-your-openai-key
VITE_MODAL_URL=https://your-modal-url.modal.run  # Optional
```

### Step 4: Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm start
# → Server running at http://localhost:8787
# → If TRYON_MODAL_URL set: modal ping starts
```

**Terminal 2 — Frontend:**
```bash
cd d:\Clients-ZeRaan\Style-Sense-Main
npm run dev
# → Vite dev server at http://localhost:3000
# → API calls to /api/* → proxied to localhost:8787
```

### Step 5: Verify Setup
```bash
# Test backend health
curl http://localhost:8787/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# Test try-on service status
curl http://localhost:8787/api/tryon/status
# Expected: { "available": true/false, ... }
```

## Deploy to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
# Follow OAuth flow
```

### Step 3: Configure and Deploy
```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set build command: npm run build
# - Set output directory: dist
```

### Step 4: Set Environment Variables on Vercel
```bash
# Use Vercel CLI
vercel env add OPENAI_API_KEY production
# Paste your API key when prompted

vercel env add VITE_MODAL_URL production
# Paste your Modal URL
```

Or set via Vercel Dashboard → Project Settings → Environment Variables.

### Step 5: Trigger Production Deploy
```bash
vercel --prod
# Or: git push origin main (auto-deploys via webhook)
```

### Step 6: Configure CORS for Production

Update `backend/.env` (or environment variables) with production frontend URL:
```bash
CORS_ORIGIN=https://your-app.vercel.app
```

---

# 18. VIVA / FYP PREPARATION

## BEGINNER QUESTIONS

---

**Q1: What is an API and what does the Express backend do in this project?**

**Answer:** An API (Application Programming Interface) is a set of rules for how two software programs communicate. In this project:

- The **React frontend** (what users see) is one program
- The **Modal GPU service** (AI image generation) is another program
- The **Express backend** sits in between, acting as a translator and security layer

Without the Express backend, the frontend would need to call Modal directly — exposing infrastructure URLs, lacking security, and having no rate limiting. The Express backend:
1. Receives requests from the React app
2. Validates they're legitimate (JWT auth, rate limiting, input validation)
3. Forwards to Modal GPU
4. Returns the result

**Viva Answer:** "The Express backend is the middleware layer that proxies requests from the frontend to the Modal GPU service. It adds security (JWT authentication, rate limiting, input validation), hides infrastructure details, and provides additional endpoints like feedback collection and model status checks."

---

**Q2: What is CORS and why did you configure it?**

**Answer:** CORS (Cross-Origin Resource Sharing) is a browser security feature that blocks websites from making API calls to a different domain.

**Example of the Problem:**
- Frontend at: `http://localhost:3000`
- Backend at: `http://localhost:8787`
- These are different "origins" (different port = different origin)
- Without CORS configuration, the browser would block all API calls

**Our Fix:**
```javascript
cors({ origin: 'http://localhost:3000' })
```
This tells the browser: "The API at port 8787 trusts requests from port 3000."

**Why It Matters for Security:** CORS prevents malicious websites from making API calls pretending to be the user. A phishing site at `evil.com` cannot call our API because `evil.com` is not in our allowed origins.

---

**Q3: What is rate limiting and why is it important?**

**Answer:** Rate limiting restricts how many requests an IP address can make in a time window.

**Our Configuration:**
- General: 120 requests per IP per 15 minutes
- Try-on specific: 20 try-on requests per IP per 15 minutes

**Why Important:**
1. **Cost Protection:** Each try-on costs ~$0.02-0.05 on Modal GPU. A bot sending 1000 requests could cost $20-50. Rate limiting caps this to $1 per 15 minutes.
2. **DoS Prevention:** Without limits, a single attacker could send thousands of requests, crashing the server.
3. **Fair Usage:** Prevents one user from monopolizing the service at the expense of others.

---

**Q4: What is Vercel and why did you deploy there?**

**Answer:** Vercel is a cloud hosting platform specialized for JavaScript/React applications.

**Why Vercel:**
1. **Zero-config React support:** Detects Vite/React automatically, knows how to build it
2. **Global CDN:** Serves static files from 70+ locations worldwide — fast for all users
3. **Free tier:** Generous free limits for small projects
4. **Git integration:** Push to GitHub → automatically deploys

**What Vercel Serves:**
- Static files (HTML, CSS, JS) → served from CDN
- API routes (Serverless Functions) → run on-demand

---

**Q5: What is Joi validation and why use it?**

**Answer:** Joi is a JavaScript library for validating the shape and content of data.

**Without Joi:**
```javascript
router.post('/generate', (req, res) => {
  if (!req.body.personImage) return res.status(400).json({error: 'personImage required'});
  if (!req.body.garmentImage) return res.status(400).json({error: 'garmentImage required'});
  if (!['upper_body', 'lower_body', 'dresses'].includes(req.body.category)) {
    return res.status(400).json({error: 'invalid category'});
  }
  // ... more manual checks
});
```

**With Joi:**
```javascript
const schema = Joi.object({
  personImage: Joi.string().required(),
  garmentImage: Joi.string().required(),
  category: Joi.string().valid('upper_body', 'lower_body', 'dresses').default('upper_body')
});

const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ error: error.details[0].message });
// Validated! value.category has default 'upper_body' if not provided
```

Benefits: Cleaner code, automatic defaults, descriptive error messages.

---

## INTERMEDIATE QUESTIONS

---

**Q6: Explain the Express middleware chain and why order matters.**

**Answer:** In Express, middleware functions execute in the order they are registered. Each middleware calls `next()` to pass control to the next function.

**Our Chain:**
```
Request → JSON Parser → Helmet → CORS → Rate Limiter → JWT Auth → Route Handler → Error Handler
```

**Why Order Matters:**
1. JSON parser must run BEFORE route handlers (handlers need `req.body`)
2. Helmet and CORS must run BEFORE any response is sent (they modify response headers)
3. Rate limiter before auth: we count even bad requests toward the limit
4. Auth before handler: handler needs `req.user` populated
5. Error handler LAST: catches errors from all routes

If you registered the error handler first, it would never receive errors (they'd go to routes, which don't exist for handling errors). If auth ran before rate limiting, rate limits would only apply to authenticated users.

---

**Q7: How does JWT authentication work between Supabase and Express?**

**Answer:**

**Token Creation (Supabase):**
```
User logs in at React frontend
→ Supabase validates password
→ Supabase signs a JWT: { sub: userId, email: '...', role: 'authenticated', exp: +1hr }
→ Signed with Supabase's JWT_SECRET
→ Returns token to frontend
→ Frontend stores in localStorage
```

**Token Verification (Express):**
```
Frontend sends: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMT...
→ Express jwtAuth.js extracts token
→ jwt.verify(token, JWT_SECRET)
   → Recomputes signature: HMAC-SHA256(header + payload, JWT_SECRET)
   → Compares with signature in token
   → If match: token is valid
   → Checks expiry: if expired, reject with 401
→ Attaches decoded payload to req.user
→ Next() → Route handler proceeds with req.user.sub = userId
```

**The Critical Link:** Both Supabase and Express must use the SAME `JWT_SECRET`. Supabase signs with it; Express verifies with it. Found in Supabase Dashboard → Project Settings → API → JWT Secret.

---

**Q8: How does the SSE (Server-Sent Events) streaming endpoint work?**

**Answer:** SSE is a technology where the server keeps an HTTP connection open and sends data to the client over time — one-directional "push" from server to client.

**Normal HTTP:**
```
Client: POST /api/tryon/generate
                        [60 seconds of silence]
Server: { "resultImage": "..." }
Client: "Was it working? Did it fail? No idea for 60 seconds"
```

**With SSE:**
```
Client: POST /api/tryon/generate-stream
Server: data: {"stage": "starting", "progress": 0}    ← immediate
Server: data: {"stage": "pose_parsing", "progress": 15} ← 3 seconds later
Server: data: {"stage": "generating", "progress": 50}   ← 15 seconds later
Server: data: {"stage": "complete", "resultImage": "..."} ← 60 seconds later
Client: "I can show a progress bar!"
```

**SSE HTTP Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

These tell the browser: "This is an event stream, don't buffer it, keep the connection alive."

**Synthetic Progress:** Since Modal doesn't emit real progress events, the Express server uses `setTimeout` to send estimated progress milestones while waiting for Modal's actual response.

---

**Q9: Walk me through exactly what happens when the frontend calls /api/tryon/generate.**

**Answer:**

```
1. React frontend:
   apiService.performVitonHDTryOn(personBase64, garmentBase64, 'upper_body')
   → axios.post('http://localhost:8787/api/tryon/generate', {
       personImage: personBase64,
       garmentImage: garmentBase64,
       category: 'upper_body',
       numSteps: 20,
       guidanceScale: 2.0,
       seed: 42
     },
     { timeout: 660000 }  // 11 min
   )

2. Vite proxy (dev) or Vercel rewrite (prod) routes to Express

3. Express receives request:
   a. express.json() parses body (up to 50MB)
   b. helmet() adds security headers to response
   c. cors() adds CORS headers (if origin matches)
   d. generalRateLimiter checks IP: 120/15min (passes)
   e. tryonLimiter checks IP: 20/15min (passes)
   f. requireAuth extracts JWT from "Authorization: Bearer ..."
      → jwt.verify() validates signature and expiry
      → req.user = { sub: "user-uuid", email: "...", role: "authenticated" }
   g. Joi validates request body:
      → personImage: valid string ✓
      → garmentImage: valid string ✓
      → category: 'upper_body' is valid ✓
      → numSteps: 20 (between 10-50) ✓

4. Express handler sends to Modal:
   axios.post('https://modal-url/tryon', {
     person_image: personBase64,  // note: snake_case for Modal
     garment_image: garmentBase64,
     category: 'upper_body',
     num_steps: 20,
     guidance_scale: 2.0,
     seed: 42
   }, { timeout: 600000 })  // 10 minutes

5. Modal GPU processes (30-60 seconds):
   → DWpose: person keypoints
   → ONNX ATR: garment mask
   → OOTDiffusion: 20 denoising steps
   → Returns: { result_image: base64, generation_time: 47.3 }

6. Express returns to frontend:
   res.json({
     success: true,
     resultImage: result.data.result_image,
     generationTime: result.data.generation_time
   })

7. Frontend receives result:
   → Converts base64 → Blob → File
   → Uploads to Supabase Storage
   → Saves to tryon_history table
   → Updates job status to 'completed'
```

---

**Q10: Why is there both a `server.js` and an `app.js` in the backend?**

**Answer:** Separation of concerns — keeping the application logic separate from the server startup logic.

**`app.js`** — Pure Express application:
- Configures middleware, routes, error handling
- Exports the `app` object
- Has no concept of "starting" a server

**`server.js`** — Server startup:
- Imports `app` from `app.js`
- Calls `app.listen(PORT)` to start the HTTP server
- Sets up the Modal ping interval

**Why Split?**
1. **Testing:** Tests can import `app.js` directly without starting a real server
2. **Vercel compatibility:** `api/[...tryon].js` imports `app.js` and uses it directly as a handler function. Vercel manages its own HTTP infrastructure — calling `app.listen()` inside a serverless function would be wrong.
3. **Reusability:** The same `app.js` works in both server mode (local dev) and serverless mode (Vercel)

---

## ADVANCED QUESTIONS

---

**Q11: What are the security implications of allowing `CORS_ORIGIN=*` (wildcard) in production?**

**Answer:** Setting `CORS_ORIGIN=*` (all origins) in production would:

1. **Defeat CSRF Protection:** Any website (including phishing sites) could make API calls. A user logged into StyleSense.AI visits `evil.com`, which runs JavaScript that calls your API using the user's session.

2. **API Key Exposure Risk:** If any page on `evil.com` can call your API, they can trigger GPU compute at your cost.

3. **Data Exfiltration:** Malicious site reads user's try-on history and profile by triggering authenticated requests.

**Correct Production Config:**
```javascript
const ALLOWED_ORIGINS = [
  'https://style-sense.vercel.app',
  'https://style-sense.com'  // custom domain if any
];

cors({
  origin: function(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);  // Allow
    } else {
      callback(new Error('Not allowed by CORS'));  // Block
    }
  }
});
```

**Note:** CORS doesn't protect against server-to-server requests (curl, Postman, other backends). Those are protected by JWT authentication.

---

**Q12: How would you add per-user rate limiting (instead of per-IP)?**

**Answer:** Current implementation uses IP-based limiting. Problem: users behind NAT share one IP (e.g., all university students get the same IP from their router).

**Per-User Implementation:**
```javascript
const userTryonCounter = new Map();  // In-memory: userId → { count, resetTime }

router.post('/generate', requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000;  // 15 minutes
  const MAX = 20;
  
  const userLimit = userTryonCounter.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired
    userTryonCounter.set(userId, { count: 1, resetTime: now + WINDOW });
  } else if (userLimit.count >= MAX) {
    return res.status(429).json({ error: 'Rate limit exceeded for your account' });
  } else {
    userLimit.count++;
  }
  
  // ... proceed with try-on
});
```

**Production Concern:** In-memory Map doesn't work across multiple server instances. Use Redis for distributed rate limiting:
```javascript
const redis = require('redis');
// Store counter in Redis with TTL
await redis.incr(`tryon_count:${userId}`);
await redis.expire(`tryon_count:${userId}`, 900);  // 15 min TTL
```

---

**Q13: How would you implement proper request tracing for debugging production issues?**

**Answer:** Request tracing links all logs from one user request together with a unique ID.

**Current Problem:** If three concurrent requests fail, logs are interleaved:
```
[10:30:01] Processing try-on
[10:30:01] Processing try-on
[10:30:45] Error: timeout
[10:30:52] Error: timeout
// Which request failed? No way to tell.
```

**With Request Tracing:**
```javascript
const { v4: uuidv4 } = require('uuid');

// Middleware: Add request ID to every request
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Update Morgan format to include requestId
app.use(morgan(':req[X-Request-Id] :method :url :status :response-time ms'));

// In route handlers:
router.post('/generate', async (req, res) => {
  console.log(`[${req.requestId}] Starting try-on for user: ${req.user.sub}`);
  // ...
  console.log(`[${req.requestId}] Modal call took: ${duration}ms`);
  console.log(`[${req.requestId}] Result size: ${resultImage.length} chars`);
});
```

Now all logs for one request share the same ID, making debugging trivial.

---

**Q14: Explain why the `express.json({ limit: '50mb' })` is critical for this project.**

**Answer:** Express's default JSON body limit is 100KB. Without increasing it, try-on requests would fail immediately with a 413 "Payload Too Large" error.

**Why Images Are Large:**
- JPEG image 1080×1080 → ~200KB binary
- Base64 encoding: binary × 1.33 → ~267KB
- Two images (person + garment) → ~534KB
- This is well within the 50MB limit

**Why 50MB and Not 1GB?**
- Prevents denial-of-service via very large payloads
- 50MB is 100× the expected legitimate request size — ample for legitimate use
- If a malicious user sends a 500MB request, Express rejects it before it reaches any route handler

**Alternative Approaches:**
1. Use multipart/form-data with file upload (better for large binary files)
2. Upload images to S3/Supabase first, send URLs to backend
3. Current approach (base64 in JSON) works but is less efficient (33% overhead from encoding)

---

**Q15: What is the `api/[...tryon].js` pattern and how does Vercel's file-based routing work?**

**Answer:** Vercel uses a file-based routing system for serverless functions. Files in the `api/` directory automatically become API routes.

**File naming conventions:**
- `api/hello.js` → handles `GET/POST /api/hello`
- `api/users/[id].js` → handles `/api/users/123` (dynamic segment)
- `api/[...tryon].js` → catch-all: handles `/api/anything/at/all`

**Our File: `api/[...tryon].js`**

The `[...tryon]` syntax is a "catch-all" route — it matches:
- `/api/tryon/generate`
- `/api/tryon/feedback`
- `/api/tryon/status`
- `/api/health`
- Any `/api/*` path

Inside the file:
```javascript
import app from '../backend/src/app.js';

export default function handler(req, res) {
  // Vercel calls this function for every /api/* request
  // We delegate to our Express app
  app(req, res);
}
```

**How Express Works as a Function:** Normally Express is started with `app.listen()`. But Express's `app` object is also just a function that takes `(req, res)` — which is exactly what Vercel's handler expects. So we pass `req` and `res` directly to Express.

---

## DEPLOYMENT QUESTIONS

---

**Q16: How do you handle the Vercel 60-second function timeout for a 60+ second operation?**

**Answer:** The try-on operation takes 30-60+ seconds on a warm Modal container and 3-5 minutes on a cold start. Vercel Hobby functions timeout at 60 seconds.

**Solution Architecture:**
```
Option 1 (Current Implementation): Direct Modal Call
  Frontend ──→ Modal GPU (via VITE_MODAL_URL)
  Bypasses Vercel functions entirely.
  Pro: No timeout issue.
  Con: Modal URL exposed in frontend bundle.

Option 2: Vercel Pro
  Upgrade to $20/month → 300-second timeout.
  Still doesn't handle 5-min cold starts.

Option 3: Async Job Pattern (Production-Ready)
  1. Frontend: POST /api/tryon/start → Express creates job, returns jobId immediately (< 1s)
  2. Express: Starts Modal call in background (non-blocking)
  3. Frontend: Poll GET /api/tryon/status/{jobId} every 5s → { status: 'processing'|'done'|'failed' }
  4. Express: When Modal responds, stores result (Supabase or Redis), marks job done
  5. Frontend: On 'done', fetches result URL

  This pattern has no timeout issues — each HTTP request is short-lived.
```

**Current Status:** Option 1 is used in production. Option 3 is the recommended production-grade architecture.

---

**Q17: How would you set up CI/CD to prevent broken deployments?**

**Answer:** Create a GitHub Actions workflow that runs tests before allowing deployment:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npx tsc --noEmit
      - name: Run tests
        run: npm test -- --coverage --ci
      - name: Build
        run: npm run build

  deploy:
    needs: test   # Only runs if test job passes
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Result:** Every push to `main` must pass TypeScript type checking, all unit tests, and a successful build before deployment runs. Broken code can't reach production.

---

**Q18: How would you monitor production errors and get alerted when things break?**

**Answer:** Several layers of monitoring:

**Layer 1 — Vercel Error Alerts:**
- Vercel Dashboard → Project → Settings → Notifications
- Set up email alerts for deployment failures
- View function error logs in real-time

**Layer 2 — Uptime Monitoring:**
```javascript
// Create a simple health-check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    modalReachable: lastModalPingStatus,
    timestamp: new Date().toISOString()
  });
});
```
Use UptimeRobot (free) or Pingdom to ping `/api/health` every minute. Alert via email/Slack if it returns error.

**Layer 3 — Error Tracking (Sentry):**
```javascript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://your-dsn@sentry.io/project' });
app.use(Sentry.Handlers.errorHandler());
```
Sentry captures all unhandled exceptions with stack traces, user context, and frequency. Sends alerts when new errors occur.

**Layer 4 — Modal Dashboard:**
Monitor GPU utilization, error rate, and p95 latency directly in the Modal dashboard.

---

**Q19: Explain the difference between the Express server running locally vs on Vercel as a serverless function.**

**Answer:**

| Aspect | Local Express Server | Vercel Serverless Function |
|---|---|---|
| Startup | Once, stays running | Fresh for each request (or reused briefly) |
| Lifetime | Until manually stopped | Seconds to minutes, then recycled |
| State | Persistent (setInterval works) | No persistent state between requests |
| Memory | Single process | New memory allocation per invocation |
| `setInterval` | Works (Modal ping active) | Doesn't work (container killed) |
| Port | Listens on 8787 | Vercel manages HTTP |
| Concurrency | Handles multiple requests simultaneously | One request per function instance (scales horizontally) |
| Cold Start | None (server already running) | ~200-500ms for new instances |

**Impact on Our Project:**
- The Modal keep-warm ping (`setInterval` in `server.js`) only works in local/traditional server mode
- On Vercel, the ping is absent → Modal can go cold → first try-on after idle = cold start
- This is why the `VITE_MODAL_URL` direct connection is preferred in production — bypasses Vercel functions' limitations entirely

---

**Q20: How would you add authentication to the `/api/tryon/detect-category` endpoint which currently has no auth?**

**Answer:** Currently, anyone can call `/detect-category` without authentication. To add auth:

**Step 1 — Add `requireAuth` middleware:**
```javascript
// Before:
router.post('/detect-category', async (req, res) => { ... });

// After:
router.post('/detect-category', requireAuth, async (req, res) => { ... });
```

**Step 2 — Update frontend to include auth token:**
```typescript
// In apiService.ts
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const response = await axios.post('/api/tryon/detect-category', 
  { garmentImage: garmentBase64 },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

**Trade-off Consideration:**
- Auth on `/detect-category` prevents anonymous category detection
- The endpoint calls Modal GPU (costs money) — auth prevents non-users from abusing it
- The rate limiter already somewhat protects it (120/15min)
- For MVP/FYP: acceptable without auth. For production with financial exposure: add auth.

---

*End of Abdullah's Documentation*
