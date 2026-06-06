# StyleSense.AI — Knowledge Transfer Document
## Team Member: Usman
### Area of Responsibility: Frontend, Authentication & Supabase Database

---

# TABLE OF CONTENTS

1. [Important Resources](#1-important-resources)
2. [Shared Project Snapshot](#2-shared-project-snapshot)
3. [Project Overview](#3-project-overview)
4. [Architecture Overview](#4-architecture-overview)
5. [Usman's Responsibilities](#5-usmans-responsibilities)
6. [Folder-by-Folder Breakdown](#6-folder-by-folder-breakdown)
7. [File-by-File Breakdown](#7-file-by-file-breakdown)
8. [Database Coverage](#8-database-coverage)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Frontend Architecture Deep Dive](#10-frontend-architecture-deep-dive)
11. [Component Architecture](#11-component-architecture)
12. [Deployment Coverage](#12-deployment-coverage)
13. [Configuration Files](#13-configuration-files)
14. [Third-Party Services](#14-third-party-services)
15. [Security Overview](#15-security-overview)
16. [Common Errors & Debugging Guide](#16-common-errors--debugging-guide)
17. [Setup Guide](#17-setup-guide)
18. [Viva / FYP Preparation](#18-viva--fyp-preparation)

---

# 1. IMPORTANT RESOURCES

## Repository & Deployment Links

| Resource | URL / Location |
|---|---|
| **Frontend Deployed URL** | https://style-sense.vercel.app (Vercel) |
| **Supabase Project** | https://heliemugpbhlyzbagnrp.supabase.co |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/heliemugpbhlyzbagnrp |
| **GitHub Repository** | Contact team lead for repo URL |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Modal GPU Service** | https://modal.com/dashboard |

## Frontend Technology Documentation

| Technology | Documentation URL |
|---|---|
| React 19 | https://react.dev |
| TypeScript 5.8 | https://www.typescriptlang.org/docs |
| Vite 6 | https://vite.dev |
| Tailwind CSS | https://tailwindcss.com/docs |
| Supabase JS Client | https://supabase.com/docs/reference/javascript |
| OpenAI SDK | https://platform.openai.com/docs |

## Datasets & Model Weights (Frontend-Relevant)

| Asset | Location | Purpose |
|---|---|---|
| `data/modelParams.json` | `src/data/modelParams.json` | 30-shirt catalog + TF-IDF/SVD/KMeans matrices for ML recommendations |
| `outfit_finder_model.pkl` | Root directory | Serialized Python ML model (used for reference/training) |
| Shirt images | Hosted externally, referenced by URL in catalog | Product images for recommendation UI |

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

## AI Summary

The system uses four AI/ML technologies:
1. **OOTDiffusion** — Diffusion-based virtual try-on model (GPU, Modal)
2. **OpenAI GPT-4o-mini** — Conversational AI, caption generation, image validation
3. **TF-IDF + SVD + KMeans** — Offline ML recommendation engine (runs in-browser)
4. **HuggingFace Mistral-7B** — Fallback chatbot

## Database Summary

Supabase PostgreSQL with 3 tables:
- `profiles` — User style quiz data (JSONB)
- `tryon_history` — Record of every virtual try-on attempt
- `feedback` — User ratings and comments

Row-Level Security (RLS) ensures users can only access their own data.

---

# 3. PROJECT OVERVIEW

## Business Problem Being Solved

Online fashion shopping has a major pain point: customers cannot see how clothes will look on their body before buying. This leads to:
- High return rates (30-40% in online fashion)
- Decision fatigue when browsing large catalogs
- Mismatches between what looks good in model photos vs on the buyer's body type

StyleSense.AI solves this by combining:
1. **Personalization** — A style quiz captures exact body measurements and preferences
2. **Smart Recommendations** — ML engine filters 30-item catalog to match style + weather
3. **Virtual Try-On** — OOTDiffusion generates realistic "you wearing the garment" images
4. **AI Advice** — GPT-powered chatbot for natural language style consultation

## Product Objectives

1. Reduce customer purchase regret through accurate virtual visualization
2. Provide weather-aware outfit curation (e.g., suggest warm fabrics in winter)
3. Create a conversational, personal-shopper-like experience
4. Store user history for returning customers (Supabase)
5. Scale to thousands of users without backend bottlenecks (Vercel CDN + Modal GPU)

## Target FYP/Academic Context

This project demonstrates:
- **Full-stack web development** (React + Node.js + PostgreSQL)
- **AI/ML integration** (diffusion models, NLP, recommendation systems)
- **Cloud deployment** (Vercel, Supabase, Modal)
- **Modern software engineering** (TypeScript, testing, CI/CD, security)

---

# 4. ARCHITECTURE OVERVIEW

## Frontend Architecture Pattern

StyleSense.AI uses a **Single Page Application (SPA)** architecture:

```
Browser loads index.html (Vercel CDN)
    ↓
React 19 boots (main.tsx → App.tsx)
    ↓
AuthContext checks Supabase session
    ↓
If not logged in → AuthPage (Login/Register)
If logged in & no quiz → StyleQuiz
If logged in & quiz complete → Dashboard + Tabs
```

## Component Tree (Simplified)

```
App.tsx
├── AuthContext.Provider
│   └── AppContext.Provider
│       ├── AuthPage.tsx (if not authenticated)
│       │   ├── AuthLayout.tsx
│       │   ├── LoginForm.tsx
│       │   └── RegisterForm.tsx
│       └── Main App (if authenticated)
│           ├── StyleQuiz.tsx (if quiz not complete)
│           └── Tab Navigation (if quiz complete)
│               ├── Dashboard.tsx
│               ├── VirtualTryOn.tsx
│               │   └── CameraCapture.tsx
│               ├── OutfitGenerator.tsx
│               ├── StyleChatbot.tsx
│               ├── CreationsPanel.tsx
│               │   └── JobItem.tsx
│               └── StyleFeedback.tsx
```

## Data Flow

```
User Action
    ↓
React Component (UI event)
    ↓
AppContext / AuthContext (state update)
    ↓
Service Layer (apiService, geminiService, storageService)
    ↓
External API (Modal GPU, Supabase, OpenAI, WeatherAPI)
    ↓
State Update (via Context setters)
    ↓
Component Re-render (React reactivity)
```

## Module Interaction Map (Usman's Area)

```
                AuthContext
                    │
            ┌───────▼──────────┐
            │   Supabase Auth  │
            └───────┬──────────┘
                    │ session
            ┌───────▼──────────┐
            │    App.tsx       │ ← Routing logic
            └───────┬──────────┘
                    │ provides context
            ┌───────▼──────────┐
            │   AppContext     │ ← Global state
            │   (quiz, jobs,  │
            │   theme, weather)│
            └──┬───────────────┘
               │ consumed by
       ┌───────▼────────────────────┐
       │     React Components       │
       │  (Dashboard, VirtualTryOn, │
       │   StyleQuiz, Chatbot, etc) │
       └───────┬────────────────────┘
               │ calls
       ┌───────▼────────────────────┐
       │     Service Layer          │
       │  storageService.ts         │ ← Supabase DB + Storage
       │  apiService.ts             │ ← Backend/Modal API
       │  geminiService.ts          │ ← OpenAI API
       └────────────────────────────┘
```

---

# 5. USMAN'S RESPONSIBILITIES

Usman is the **Frontend Engineer + Database Administrator** for this project.

## Primary Ownership Areas

### 1. React Frontend (All UI)
You own every visual component the user sees. This includes the login page, style quiz, dashboard, virtual try-on interface, chatbot, outfit generator, and history panel.

**Key Skill Required:** React 19, TypeScript, Tailwind CSS, Vite

### 2. Application State Management
You own both Context providers (AuthContext and AppContext). These are the "brain" of the frontend — every component reads data from here and dispatches actions through here.

**Key Skill Required:** React Context API, hooks (useState, useEffect, useContext, useCallback)

### 3. Supabase Database Schema
You own the database design. You created the `profiles`, `tryon_history`, and `feedback` tables. You wrote the SQL for Row-Level Security (RLS) policies.

**Key Skill Required:** PostgreSQL, Supabase dashboard, SQL, RLS policies

### 4. Supabase Authentication
You own the entire authentication flow — registration, login, Google OAuth, session management, and password reset.

**Key Skill Required:** Supabase Auth SDK, OAuth 2.0 concepts

### 5. Supabase Storage
You own the storage bucket design — where try-on images are stored, how they are organized by user, and who has access.

**Key Skill Required:** Supabase Storage SDK, storage policies

### 6. Frontend Testing
You own the Jest + React Testing Library test suite covering components, contexts, and hooks.

**Key Skill Required:** Jest, React Testing Library, mocking (Supabase, fetch)

### 7. Frontend Build & Deployment
You own the Vercel deployment configuration, environment variables for the frontend, and the Vite build pipeline.

**Key Skill Required:** Vercel platform, Vite build system, environment variable management

---

# 6. FOLDER-BY-FOLDER BREAKDOWN

All paths are relative to `d:\Clients-ZeRaan\Style-Sense-Main\`

## Root-Level Frontend Files

| Folder/File | Purpose |
|---|---|
| `src/` | All frontend source code (React, TypeScript) |
| `dist/` | Compiled/built output from `npm run build` — what Vercel actually serves |
| `public/` | Static files (favicon, etc.) |
| `__tests__/` | All Jest test files |
| `backend/` | Express API server (Abdullah's area) |
| `modal/` | Python GPU service (Ali's area) |
| `hf-space/` | Hugging Face Spaces deployment |
| `api/` | Vercel serverless function wrapper |
| `docs/` | Project documentation files |

## src/ Directory

```
src/
├── components/      ← All React UI components (Usman owns ALL of these)
├── contexts/        ← React Context providers (state management)
├── services/        ← API and data access layer
├── hooks/           ← Custom React hooks
├── lib/             ← Utility libraries (Supabase client)
├── data/            ← Static JSON data (ML model params)
├── App.tsx          ← Root component with routing
├── index.tsx        ← React DOM entry point
├── types.ts         ← All TypeScript interfaces
├── config.ts        ← API keys and feature configuration
└── constants.ts     ← Navigation items, feature flags
```

## src/components/

The largest directory. Contains all visual UI:

```
components/
├── Auth/
│   ├── AuthLayout.tsx     ← Wrapper with logo, background for auth pages
│   ├── LoginForm.tsx      ← Email + password login form
│   └── RegisterForm.tsx   ← Name + email + password registration
├── Feedback/
│   └── StyleFeedback.tsx  ← Star rating (1-5) + comment textarea
├── Share/
│   └── StyleShareModal.tsx ← Modal with AI-generated captions for sharing
├── Creations/
│   └── JobItem.tsx         ← Single job card (status, result image, retry)
├── Dashboard.tsx           ← Main home screen
├── VirtualTryOn.tsx        ← Try-on initiation interface
├── OutfitGenerator.tsx     ← Search interface with AI backend
├── StyleChatbot.tsx        ← Conversational chatbot interface
├── StyleQuiz.tsx           ← Multi-step onboarding questionnaire
├── TryOnResult.tsx         ← Result image display
├── CameraCapture.tsx       ← Webcam/file input for photos
├── CreationsPanel.tsx      ← List of all try-on jobs
├── AuthPage.tsx            ← Entry authentication page
└── Spinner.tsx             ← Loading indicator
```

## src/contexts/

State management layer:

```
contexts/
├── AuthContext.tsx    ← User session, login/logout/register
└── AppContext.tsx     ← Global app state (quiz, jobs, weather, catalog)
```

## src/services/

All external data access:

```
services/
├── apiService.ts         ← Backend & Modal API calls
├── geminiService.ts      ← OpenAI GPT calls
├── storageService.ts     ← Supabase storage & database (USMAN OWNS THIS)
├── mlRecommend.ts        ← ML recommendation engine (Ali's area)
├── huggingFaceService.ts ← HuggingFace fallback chatbot (Ali's area)
└── poseService.ts        ← Pose detection helper (Ali's area)
```

## src/hooks/

```
hooks/
└── useWeather.ts   ← Custom React hook: weather + geolocation
```

## src/lib/

```
lib/
└── supabaseClient.ts   ← Creates and exports the Supabase JS client
```

## src/data/

```
data/
└── modelParams.json   ← 30-shirt product catalog + ML model vectors
```

## __tests__/ (Testing)

```
__tests__/
├── AppContext.test.tsx
├── AuthContext.test.tsx
├── CreationsPanel.test.tsx
├── Dashboard.test.tsx
├── Onboarding.test.tsx
├── apiService.test.ts
├── geminiService.test.ts
├── useWeather.test.ts
└── integration/
    └── TryOnFlow.test.tsx
```

---

# 7. FILE-BY-FILE BREAKDOWN

## App.tsx — Main Application Router

**Purpose:** The root React component. Controls which screen is shown based on authentication state and quiz completion.

**Responsibilities:**
- Wraps entire app in `AuthContext.Provider` and `AppContext.Provider`
- Reads `user` from AuthContext to check if logged in
- Reads `isQuizCompleted` from AppContext to check onboarding
- Renders `AuthPage` if not logged in
- Renders `StyleQuiz` if logged in but quiz not done
- Renders main tab interface if fully onboarded
- Manages active tab state (Dashboard, VirtualTryOn, OutfitGenerator, StyleChatbot, CreationsPanel, Feedback)
- Provides dark/light theme toggle button

**Key Logic:**
```
if (!user) → show <AuthPage />
else if (!isQuizCompleted) → show <StyleQuiz />
else → show main app with tab navigation
```

**Inputs:** None (top-level component)
**Outputs:** Renders the entire application UI
**Dependencies:** AuthContext, AppContext, all major components
**Business Relevance:** This is the app's "traffic controller" — it ensures users complete authentication and onboarding before accessing features.

---

## index.tsx — React Entry Point

**Purpose:** The absolute first file that runs in the browser. Mounts the React app into the DOM.

**Responsibilities:**
- Imports React and ReactDOM
- Finds the `<div id="root">` element in index.html
- Calls `ReactDOM.createRoot(root).render(<App />)`
- Imports global CSS (Tailwind)

**Why It Exists:** Every React app needs an entry point. Vite uses this file as the starting point for bundling.

**Business Relevance:** Without this file, the app simply wouldn't start.

---

## index.html — HTML Template

**Purpose:** The single HTML page for the SPA. Vite injects the JavaScript bundle here.

**Key Contents:**
- `<meta>` tags (viewport, charset)
- `<link>` to favicon
- `<div id="root">` — the mount point React uses
- `<script type="module" src="/src/index.tsx">` — Vite entry

**Business Relevance:** The "shell" into which the entire React app is injected.

---

## types.ts — TypeScript Type Definitions

**Purpose:** Central location for ALL TypeScript interfaces used across the app. Think of it as the "data contract" file.

**Key Types Defined (30+ interfaces):**

| Type | Purpose |
|---|---|
| `User` | Supabase auth user shape |
| `QuizDetails` | User's style quiz answers (vibe, bodyType, gender, measurements, season, occasion) |
| `TryOnJob` | A single virtual try-on job (id, status, personImage, garmentImage, resultImage, etc.) |
| `TryOnJobStatus` | Enum: 'processing' | 'completed' | 'failed' |
| `Product` | A shirt from the 30-item catalog (id, name, color, style, fabric, imageUrl, etc.) |
| `WeatherData` | Weather API response (temp, description, icon, location) |
| `ChatMessage` | A message in the StyleChatbot (role: 'user'|'assistant', content) |
| `GeneratedOutfit` | An outfit suggestion from OutfitGenerator |
| `FeedbackData` | User rating + comment |
| `AuthContextType` | Shape of AuthContext value |
| `AppContextType` | Shape of AppContext value |

**Why This File Exists:** TypeScript requires all custom types to be defined somewhere. Centralizing them in one file makes it easy to see the "shape of data" flowing through the entire app.

**Business Relevance:** Prevents runtime bugs by catching type mismatches at compile time.

---

## config.ts — API Configuration

**Purpose:** Stores all API keys and feature-level configuration constants.

**Key Exports:**
```typescript
export const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;
export const WEATHER_API_KEY = "...";  // WeatherAPI.com key
export const HUGGINGFACE_API_KEY = "...";
export const MODAL_URL = import.meta.env.VITE_MODAL_URL;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';
```

**Why It Exists:** Centralizes configuration so changing an API key only requires editing one file, not hunting through the entire codebase.

**Security Note:** In production, API keys should be in environment variables, NOT hardcoded. The `import.meta.env.*` pattern reads from `.env.local` (never committed to git).

---

## constants.ts — App-Level Constants

**Purpose:** Navigation tab definitions and feature flags.

**Key Exports:**
```typescript
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'try-on', label: 'Try On', icon: '👕' },
  { id: 'outfit-gen', label: 'Outfits', icon: '✨' },
  // ...
];
export const USE_GEMINI_CHATBOT = true;  // false = use HuggingFace
```

**Why It Exists:** Keeps magic strings and booleans in one place. Changing the navigation structure or switching chatbot providers only requires editing this file.

---

## vite.config.ts — Build Configuration

**Purpose:** Configures how Vite builds the frontend application.

**Key Settings:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8787'  // Dev: proxy API calls to Express
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-openai': ['openai'],
          'ml-model-data': ['./src/data/modelParams.json']
        }
      }
    }
  }
});
```

**Why `manualChunks` Matters:** Without chunking, the entire app would be one huge JS file. Splitting by vendor creates smaller files that load faster and can be cached independently by the browser.

**The Proxy:** During local development, API calls to `/api/*` are automatically forwarded to `localhost:8787` (the Express server). In production on Vercel, the `vercel.json` rewrites handle this instead.

---

## vercel.json — Vercel Deployment Config

**Purpose:** Tells Vercel how to build and serve the application.

**Content:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**The `rewrites` Explained:**
1. `/api/*` → Routes to Vercel Serverless Functions in the `api/` folder
2. `/*` → Falls back to `index.html` — this is what makes React Router work. Without it, refreshing on `/dashboard` would give a 404.

**Business Relevance:** Without this file, the Vercel deployment would fail or break SPA routing.

---

## tsconfig.json — TypeScript Configuration

**Purpose:** Tells the TypeScript compiler how to process the code.

**Key Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

**`strict: true`** — Enables all TypeScript strictness checks. This catches potential null pointer errors, incorrect types, and other bugs at compile time rather than runtime.

**`paths: { "@/*": ["src/*"] }`** — Allows imports like `import { X } from '@/services/apiService'` instead of long relative paths like `../../services/apiService`.

---

## src/lib/supabaseClient.ts — Supabase Initialization

**Purpose:** Creates and exports the single Supabase client instance used throughout the entire frontend.

**Content:**
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://heliemugpbhlyzbagnrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Why One Instance:** React apps should have a single Supabase client. Creating multiple instances can cause authentication state conflicts.

**The `ANON_KEY`:** This is a public key — it is safe to expose in frontend code. It only allows operations that are permitted by Row-Level Security (RLS) policies. Without valid RLS, even the anon key could access all data.

**Dependencies:** `@supabase/supabase-js` npm package
**Used By:** AuthContext.tsx, storageService.ts

---

## src/contexts/AuthContext.tsx — Authentication State

**Purpose:** Provides authentication state and functions to every component in the app.

**State Managed:**
```typescript
{
  user: User | null,        // Current logged-in user (null if not logged in)
  session: Session | null,  // Supabase session object
  loading: boolean          // True while checking auth on first load
}
```

**Functions Provided:**
```typescript
login(email, password)     → Promise<void>
register(name, email, pass) → Promise<void>
loginWithGoogle()          → Promise<void>
logout()                   → Promise<void>
resetPassword(email)       → Promise<void>
```

**How It Works:**
```typescript
// On mount, subscribe to Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
  setSession(session);
  setLoading(false);
});
```

This means the app automatically knows when a user logs in or out — even from a different browser tab. Supabase fires this callback whenever auth state changes.

**Google OAuth Flow:**
1. `loginWithGoogle()` calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Browser redirects to Google's login page
3. After consent, Google redirects back to the app with an auth code
4. Supabase exchanges the code for a session
5. `onAuthStateChange` fires with the new session

**Business Relevance:** Without AuthContext, every component that needs to know "who is logged in" would have to manage auth state independently — causing conflicts and bugs.

---

## src/contexts/AppContext.tsx — Global Application State

**Purpose:** The "master state" of the application. Stores everything that needs to be shared between components: quiz data, try-on jobs, weather, products, theme.

**State Variables (all managed here):**

| State | Type | Purpose |
|---|---|---|
| `quizDetails` | `QuizDetails` | Style quiz answers (vibe, size, measurements) |
| `isQuizCompleted` | `boolean` | Whether onboarding is done |
| `weather` | `WeatherData \| null` | Current weather & location |
| `tryOnJobs` | `TryOnJob[]` | Queue of virtual try-on jobs |
| `generatedOutfits` | `GeneratedOutfit[]` | AI-suggested outfit combos |
| `products` | `Product[]` | 30-shirt product catalog |
| `isDarkMode` | `boolean` | UI theme |
| `selectedProduct` | `Product \| null` | Currently selected item for try-on |

**Key Functions:**

### `startTryOnJob(personImage, garment, garmentName)`
This is the most complex function in the entire frontend. Here is the full flow:

```
1. Generate unique jobId (UUID)
2. Add job to tryOnJobs with status='processing'
3. Convert personImage (File/Blob/base64) → base64 string
4. Call apiService.detectGarmentCategory(garmentImage)
   → Returns 'upper_body' | 'lower_body' | 'dresses'
5. Call apiService.performVitonHDTryOn(personBase64, garmentBase64, category)
   → Sends to Modal GPU, waits up to 11 minutes
   → Returns base64 result image
6. Convert base64 → Blob → File
7. Call storageService.uploadTryOnImage(resultFile, userId)
   → Uploads to Supabase Storage: tryons/{userId}/{timestamp}.png
   → Returns public URL
8. Call storageService.saveTryOnRecord(userId, imageUrl, garmentName, garmentImageUrl)
   → Inserts row in tryon_history table
9. Update job status to 'completed', store resultImageUrl
10. On any error → update job status to 'failed', store error message
```

### `saveQuizDetails(details)` / `loadQuizFromProfile()`
- `saveQuizDetails`: Saves to AppContext state + calls `storageService.saveUserProfile()`
- `loadQuizFromProfile`: On app load, fetches profile from Supabase to restore quiz state

### `retryTryOnJob(jobId)`
Re-runs `startTryOnJob` for a previously failed job.

### `clearJobs()`
Resets the tryOnJobs array to empty.

**Why It's A Context (Not Local State):** Multiple components need the same data simultaneously:
- `Dashboard` needs `products` and `weather`
- `VirtualTryOn` needs `tryOnJobs` and `selectedProduct`
- `CreationsPanel` needs `tryOnJobs`
- `StyleQuiz` needs to write to `quizDetails`

Without a shared context, these components would have to pass props down multiple levels ("prop drilling"), making the code messy and hard to maintain.

---

## src/services/storageService.ts — Supabase Data Access

**Purpose:** All database and storage operations with Supabase. This is the only file that talks to Supabase's database and storage APIs.

**Functions:**

### `uploadTryOnImage(imageFile, userId)`
```typescript
Input: File object, user UUID
Process: supabase.storage.from('tryons').upload(`${userId}/${timestamp}.png`, file)
Output: Public URL string like https://...supabase.co/storage/v1/object/public/tryons/...
```

### `saveTryOnRecord(userId, imageUrl, garmentName, garmentImageUrl)`
```typescript
Input: IDs and URLs
Process: supabase.from('tryon_history').insert({user_id, image_url, garment_name, garment_image_url})
Output: void (throws on error)
```

### `fetchUserTryOnHistory(userId)`
```typescript
Input: user UUID
Process: supabase.from('tryon_history').select('*').eq('user_id', userId).order('created_at', desc)
Output: TryOnRecord[] | null
```

### `saveUserProfile(userId, quizData)`
```typescript
Input: user UUID, QuizDetails object
Process: supabase.from('profiles').upsert({id: userId, quiz_data: quizData, updated_at: new Date()})
Output: void
```

### `fetchUserProfile(userId)`
```typescript
Input: user UUID
Process: supabase.from('profiles').select('quiz_data').eq('id', userId).single()
Output: QuizDetails | null
```

**Why Centralized:** All Supabase database calls are in one file. If the database schema changes (e.g., rename a column), you only need to update this one file.

---

## src/components/Auth/ — Authentication UI

### AuthPage.tsx
**Purpose:** Entry point for unauthenticated users. Decides whether to show login or register form.
**State:** `isLogin` boolean — toggles between LoginForm and RegisterForm
**Dependencies:** AuthLayout, LoginForm, RegisterForm

### Auth/AuthLayout.tsx
**Purpose:** Provides consistent visual wrapper for auth pages — logo, background gradient, centered card.
**Inputs:** `children` prop (the form component)
**Business Relevance:** Branding consistency. The StyleSense.AI logo and visual identity are shown here.

### Auth/LoginForm.tsx
**Purpose:** Email + password login form.
**Key Logic:**
```typescript
const handleSubmit = async () => {
  await login(email, password);  // calls AuthContext.login
  // on success: AuthContext updates user → App.tsx re-renders
}
```
**Validation:** Checks for empty fields, valid email format
**Error Display:** Shows Supabase error messages (wrong password, user not found)

### Auth/RegisterForm.tsx
**Purpose:** New user registration form.
**Fields:** Name, Email, Password, Confirm Password
**Key Logic:**
```typescript
const handleSubmit = async () => {
  if (password !== confirmPassword) { /* show error */ }
  await register(name, email, password);  // calls AuthContext.register
}
```
**Post-Registration:** Supabase sends a verification email by default. User is auto-logged in.

---

## src/components/StyleQuiz.tsx — Onboarding Quiz

**Purpose:** Multi-step questionnaire to collect the user's style preferences. This data drives all recommendations.

**Questions Collected:**
1. **Vibe** — "Casual", "Smart Casual", "Formal", "Sporty", "Streetwear", "Bohemian"
2. **Gender** — "Male", "Female", "Prefer not to say"
3. **Body Type** — "Slim", "Athletic", "Average", "Curvy", "Plus Size"
4. **Measurements** — Height (ft + in), Bust, Waist, Hips (in inches)
5. **Season** — "Spring", "Summer", "Autumn", "Winter"
6. **Occasion** — "Casual", "Work", "Party", "Sports", "Date Night"

**Implementation Pattern:**
- Multi-step form (one question per screen)
- Progress bar shows current step
- "Back" and "Next" buttons
- Final step calls `saveQuizDetails(quizData)` which persists to Supabase

**Business Relevance:** Without this data, the ML recommendation engine has nothing to work with. The quiz is the personalization foundation of the entire product.

---

## src/components/Dashboard.tsx — Home Screen

**Purpose:** The main landing page after login and quiz completion. Shows personalized recommendations, weather, and style profile.

**What It Displays:**
1. **Weather Banner** — Current temperature, condition, location from `useWeather`
2. **Style Profile Summary** — User's vibe, body type, season from quiz
3. **Recommended Products Grid** — 30 shirts filtered/ranked by ML engine
4. **"Shop Now" / "Try On" Buttons** per product

**Data Sources:**
- `products` from AppContext (30-shirt catalog)
- `weather` from AppContext (via useWeather hook)
- `quizDetails` from AppContext (style quiz answers)
- ML ranking from `mlRecommend.ts` (called internally or via geminiService)

**Key Interaction:** Clicking "Try On" on a product card sets `selectedProduct` in AppContext and navigates to the VirtualTryOn tab.

---

## src/components/VirtualTryOn.tsx — Try-On Interface

**Purpose:** The interface for initiating virtual try-on. Users upload/capture their photo and select a garment.

**UI Flow:**
1. User selects garment from product catalog
2. User uploads photo or captures via CameraCapture
3. User clicks "Generate Try-On"
4. `startTryOnJob()` from AppContext is called
5. Job appears in `tryOnJobs` with status 'processing'
6. After completion, result is shown

**States Shown:**
- Idle: Upload area + garment selector
- Processing: Spinner with "Generating your look..."
- Completed: Result image + "Share" / "Save" options
- Failed: Error message + "Retry" button

**Dependencies:** AppContext (startTryOnJob, tryOnJobs), CameraCapture

---

## src/components/CreationsPanel.tsx — Job History

**Purpose:** Shows the full history of try-on jobs — past completions, currently processing jobs, and failed attempts.

**Displays:**
- Each job as a `JobItem` card
- Status badge (Processing / Completed / Failed)
- Result image (if completed)
- Timestamp
- "Retry" button (if failed)
- "Share" button (if completed)

**Data Source:** `tryOnJobs` from AppContext

---

## src/components/Creations/JobItem.tsx — Single Job Card

**Purpose:** Renders one try-on job entry in the CreationsPanel.

**Props:**
```typescript
interface JobItemProps {
  job: TryOnJob;
  onRetry: (jobId: string) => void;
  onShare: (job: TryOnJob) => void;
}
```

**Visual States:** Three distinct card designs for processing / completed / failed

---

## src/components/StyleChatbot.tsx — AI Chat Interface

**Purpose:** Conversational interface for asking style questions. Powered by OpenAI GPT-4o-mini.

**Message Format:**
```
User: "What should I wear to a summer wedding?"
AI: [GPT-4o-mini response with outfit recommendations]
```

**Technical Flow:**
1. User types message, hits Send
2. Message added to local `chatMessages` state
3. `geminiService.getGeminiChatResponse(messages, quizDetails)` called
4. GPT-4o-mini receives entire conversation history + user's quiz profile
5. Response appended to `chatMessages`

**Why Quiz Details Are Sent:** The chatbot is given the user's style profile (vibe, body type, season) as system context so recommendations are personalized.

---

## src/components/OutfitGenerator.tsx — Outfit Search

**Purpose:** Natural language outfit search. User types what they're looking for, AI returns matching outfits from the catalog.

**Example Queries:**
- "A blue casual shirt for winter"
- "Smart formal look for a job interview"
- "Summer beach outfit"

**Technical Flow:**
1. User types query
2. `geminiService.findMatchingOutfits(query, products)` called
3. Internally: ML recommendation runs, then GPT formats results
4. Results displayed as product cards

---

## src/components/Share/StyleShareModal.tsx — Social Sharing

**Purpose:** Modal dialog for sharing try-on results on social media.

**Features:**
- Shows the result image
- Generates AI captions for Instagram, Twitter, Facebook
- "Copy" button for each caption
- Direct share buttons

**Technical Flow:**
1. User clicks "Share" on a completed job
2. Modal opens with the result image
3. `geminiService.generateSocialMediaCaptions(imageUrl, quizDetails)` called
4. GPT-4o-mini generates 3 platform-specific captions
5. User copies/shares

---

## src/components/Feedback/StyleFeedback.tsx — Ratings

**Purpose:** Collects user satisfaction ratings (1-5 stars) and text comments.

**Storage:** `storageService.ts` → Supabase `feedback` table

**When Shown:** After completing a try-on, or accessible from the main navigation

---

## src/components/CameraCapture.tsx — Camera Input

**Purpose:** Handles both webcam capture and file upload for person photos.

**Modes:**
1. **File Upload:** `<input type="file" accept="image/*">` 
2. **Camera:** Uses `navigator.mediaDevices.getUserMedia()` API to access webcam, renders live preview in `<video>`, captures frame to `<canvas>`

**Output:** Returns base64-encoded image string to parent component (VirtualTryOn)

**Browser Permissions:** Requires user to grant camera access. Handles `PermissionDeniedError` gracefully.

---

## src/hooks/useWeather.ts — Weather Hook

**Purpose:** Custom React hook that fetches and returns current weather data.

**Strategy (Three-Layer Fallback):**
1. **IP-based Instant Weather:** On mount, immediately fetch weather by IP (no permission needed, instant, may be inaccurate)
2. **Geolocation Weather:** Request browser location permission, if granted fetch more accurate weather
3. **Fallback:** If both fail, show empty/placeholder weather

**API Used:** WeatherAPI.com
- Endpoint: `https://api.weatherapi.com/v1/current.json?key={API_KEY}&q={location}`

**Return Shape:**
```typescript
{
  temperature: number,    // Celsius
  description: string,   // "Partly cloudy"
  iconUrl: string,       // Weather icon URL
  location: string,      // "Lahore"
  country: string,       // "Pakistan"
  isLoading: boolean
}
```

**Business Relevance:** Weather data enables season-aware recommendations (e.g., show warm fabrics when it's cold).

---

# 8. DATABASE COVERAGE

## Supabase Project Details

| Field | Value |
|---|---|
| Project URL | https://heliemugpbhlyzbagnrp.supabase.co |
| Region | (check Supabase dashboard) |
| Database | PostgreSQL 15 |
| Auth Provider | Supabase Auth |

## Table 1: `profiles`

**Purpose:** Stores each user's style quiz responses. One row per user.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**The `quiz_data` JSONB Column Stores:**
```json
{
  "vibe": "Casual",
  "bodyType": "Athletic",
  "gender": "Male",
  "heightFt": 5,
  "heightIn": 10,
  "bust": 38,
  "waist": 32,
  "hips": 38,
  "season": "Winter",
  "occasion": "Casual"
}
```

**Why JSONB Instead of Columns?** Using JSONB is flexible — the quiz can be extended with new questions without requiring database schema migrations. JSONB also supports indexing for fast queries.

**RLS Policies:**
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

---

## Table 2: `tryon_history`

**Purpose:** Records every virtual try-on attempt. Used in CreationsPanel for history display.

```sql
CREATE TABLE tryon_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  garment_name TEXT,
  garment_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Field Explanations:**
- `image_url` — URL of the generated try-on result image in Supabase Storage
- `garment_name` — Human-readable name ("Blue Casual Shirt")
- `garment_image_url` — URL of the original garment photo used
- `ON DELETE CASCADE` — If user account is deleted, all their history is deleted too

**RLS Policies:**
```sql
-- Users can see only their own history
CREATE POLICY "Users can view own history" ON tryon_history
FOR SELECT USING (auth.uid() = user_id);

-- Users can add their own records
CREATE POLICY "Users can insert own history" ON tryon_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete own history" ON tryon_history
FOR DELETE USING (auth.uid() = user_id);
```

---

## Table 3: `feedback`

**Purpose:** Stores user ratings and comments.

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**`ON DELETE SET NULL`:** If user deletes account, feedback stays in DB but user_id becomes NULL. This preserves aggregate rating data for analytics.

**RLS Policy:**
```sql
-- Any authenticated user can submit feedback
CREATE POLICY "Authenticated users can insert feedback" ON feedback
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

---

## Supabase Storage

### Bucket: `tryons`

```
Configuration:
- Visibility: Public (files accessible without auth via URL)
- Path Structure: {userId}/{timestamp}.png
  Example: tryons/abc-123-def/1703001234567.png
```

**Storage Policies:**
```sql
-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own try-ons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'tryons' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Users can delete their own files
CREATE POLICY "Users can delete own try-ons" ON storage.objects
FOR DELETE USING (
  bucket_id = 'tryons' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Anyone can view try-on images (public bucket)
CREATE POLICY "Public read for try-ons" ON storage.objects
FOR SELECT USING (bucket_id = 'tryons');
```

**Why Public?** Try-on result images need to be shareable via URL on social media. If the bucket were private, only logged-in users could view the images, breaking the sharing feature.

---

## Database Relationships

```
auth.users (Supabase managed)
    │
    ├──(1:1)── profiles
    │              └── quiz_data (JSONB)
    │
    ├──(1:N)── tryon_history
    │              └── image_url → storage.objects (tryons bucket)
    │
    └──(1:N)── feedback
```

---

## Supabase Setup SQL Script

Reference: `SUPABASE_SETUP.md` in the project root. The complete setup requires:

1. Create `profiles` table
2. Create `tryon_history` table
3. Create `feedback` table
4. Enable RLS on all three tables
5. Create all RLS policies
6. Create `tryons` storage bucket
7. Create storage policies
8. (Optional) Create trigger to auto-create profile on user registration

**Auto-Profile Trigger:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

This trigger automatically creates a blank `profiles` row when a user registers, so `fetchUserProfile()` always has a row to update.

---

# 9. AUTHENTICATION & AUTHORIZATION

## Authentication Flow

### Registration Flow
```
1. User fills RegisterForm (name, email, password, confirm password)
2. Client-side validation (passwords match, email format)
3. AuthContext.register(name, email, password) called
4. → supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
5. Supabase creates user in auth.users
6. Supabase sends verification email
7. onAuthStateChange fires → user state updated
8. App.tsx re-renders → shows StyleQuiz (no quiz data yet)
```

### Login Flow
```
1. User fills LoginForm (email, password)
2. AuthContext.login(email, password) called
3. → supabase.auth.signInWithPassword({ email, password })
4. Supabase returns session (JWT tokens)
5. onAuthStateChange fires → user + session state updated
6. App.tsx re-renders → checks if quiz completed
7. If quiz complete → Dashboard; if not → StyleQuiz
```

### Google OAuth Flow
```
1. User clicks "Sign in with Google"
2. AuthContext.loginWithGoogle() called
3. → supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
4. Browser redirects to Google OAuth page
5. User grants permission
6. Google redirects back to app with OAuth code
7. Supabase exchanges code for session
8. onAuthStateChange fires with new session
9. App continues as normal login
```

### Session Persistence
Supabase automatically persists sessions in `localStorage`. On page reload:
```
App mounts → supabase.auth.getSession() → restores session from localStorage
→ onAuthStateChange fires → user state populated
→ App shows correct screen without requiring re-login
```

Session tokens auto-refresh before expiry (Supabase handles this).

### Logout Flow
```
1. User clicks Logout
2. AuthContext.logout() called
3. → supabase.auth.signOut()
4. Supabase clears localStorage session
5. onAuthStateChange fires with null session
6. user state set to null
7. App.tsx re-renders → shows AuthPage
```

## Authorization Model

**Row-Level Security (RLS):** Every database query is filtered automatically by Supabase to show only the logged-in user's data.

**How It Works:**
- When frontend calls `supabase.from('tryon_history').select('*')`, Supabase automatically appends `WHERE user_id = auth.uid()` based on RLS policies
- The `auth.uid()` function returns the UUID from the JWT token in the request header
- No data from other users can ever be returned, even if the frontend code has a bug

**The `supabase` Anon Key:** The public ANON key is safe to expose in the frontend because:
1. RLS policies restrict what it can do
2. Users can only access their own data
3. The only "unrestricted" operation is reading from the public `tryons` storage bucket (which is intentional)

---

# 10. FRONTEND ARCHITECTURE DEEP DIVE

## React 19 Features Used

**`use()` Hook:** React 19 introduces the `use()` hook for reading Promises and Context in render. The project primarily uses the stable `useContext` hook.

**Concurrent Features:** React 19's concurrent rendering allows the app to remain responsive while processing heavy operations (like image conversion).

**Server Components:** Not used (this is a Vite SPA, not Next.js).

## State Management Strategy

The project uses **React Context + useState** instead of external libraries like Redux or Zustand.

**Reasoning:**
- The app has manageable state complexity
- No need for time-travel debugging, middleware, or DevTools
- Context is built into React — no additional dependencies
- Simpler learning curve for academic/FYP context

**Two Contexts:**
1. `AuthContext` — Authentication only (separate to avoid unnecessary re-renders of auth-unrelated components)
2. `AppContext` — Everything else (quiz, jobs, weather, products, theme)

## Tailwind CSS Architecture

The project uses Tailwind CSS utility classes exclusively. No separate CSS files (except global styles in index.css).

**Key Tailwind Patterns Used:**
- `dark:bg-gray-900 bg-white` — Dark mode variants
- `flex items-center justify-between` — Flexbox layouts
- `grid grid-cols-1 md:grid-cols-3` — Responsive grids
- `hover:bg-blue-600 transition-colors` — Interactive states
- `rounded-xl shadow-md` — Card styling

**Dark Mode:** Controlled by `isDarkMode` in AppContext. When true, the root element gets the `dark` class, activating all `dark:` Tailwind variants.

## Image Handling Strategy

The virtual try-on pipeline requires careful image handling:

1. **File → Base64:** User uploads file → `FileReader.readAsDataURL()` → base64 string
2. **Base64 → Blob:** Result base64 → `atob()` → `Uint8Array` → `Blob`
3. **Blob → File:** `new File([blob], 'filename.png', { type: 'image/png' })`
4. **File → Supabase:** `supabase.storage.upload(path, file)`

This conversion chain handles the different formats needed at each step of the pipeline.

---

# 11. COMPONENT ARCHITECTURE

## Component Design Principles

1. **Container vs Presentational:** Components like `Dashboard` are "smart" (connect to context). Components like `JobItem` and `Spinner` are "dumb" (receive props, no context).

2. **Single Responsibility:** Each component has one clear job. `CameraCapture` only handles image input. `Spinner` only shows loading state.

3. **Composition:** Complex UIs are composed from smaller pieces. `CreationsPanel` is composed of multiple `JobItem` components.

## Data Flow Pattern (Props vs Context)

```
AppContext
    │ (consumed via useContext)
    │
Components that need global state:
├── Dashboard (reads products, weather, quizDetails)
├── VirtualTryOn (reads/writes tryOnJobs)
├── StyleChatbot (reads quizDetails)
└── CreationsPanel (reads tryOnJobs)

Components that only use props (no context):
├── JobItem (receives job as prop)
├── Spinner (stateless)
├── AuthLayout (layout wrapper)
└── TryOnResult (receives result as prop)
```

---

# 12. DEPLOYMENT COVERAGE

## Vercel Deployment

**Platform:** Vercel — Automatically detects Vite/React projects

**Build Process:**
```
git push to main branch
→ Vercel detects change
→ Runs: npm install && npm run build
→ Vite bundles all TypeScript → JavaScript
→ Output placed in dist/
→ Vercel serves dist/ via global CDN
```

**Build Artifacts (dist/):**
```
dist/
├── index.html              ← SPA shell
├── favicon.ico
└── assets/
    ├── index-[hash].js     ← App code
    ├── vendor-react-[hash].js    ← React library (cached separately)
    ├── vendor-supabase-[hash].js ← Supabase library
    ├── vendor-openai-[hash].js   ← OpenAI library
    └── ml-model-data-[hash].js  ← 30-shirt catalog
```

**Why Chunk Splitting?** Each chunk is named with a content hash. If React's code doesn't change between deployments, users' browsers serve React from cache — faster page loads.

## Environment Variables on Vercel

In the Vercel dashboard → Project Settings → Environment Variables:
```
OPENAI_API_KEY = sk-...
VITE_MODAL_URL = https://...modal.run (optional)
VITE_BACKEND_URL = https://...backend.com (optional)
```

**Note:** Vite only exposes variables prefixed with `VITE_` to the frontend bundle. The `OPENAI_API_KEY` without a prefix will be available as `import.meta.env.OPENAI_API_KEY` if configured in Vite.

## Local Development Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Fill in .env.local:
OPENAI_API_KEY=sk-your-key-here
VITE_MODAL_URL=https://your-modal-url  # optional

# 4. Start Vite dev server
npm run dev
# → Frontend on http://localhost:3000
# → API calls proxied to http://localhost:8787

# 5. (In separate terminal) Start Express backend
cd backend && npm install && npm start
# → Backend on http://localhost:8787
```

---

# 13. CONFIGURATION FILES

## package.json (Root — Frontend)

```json
{
  "name": "style-sense",
  "version": "0.0.0",
  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@supabase/supabase-js": "^2.x",
    "openai": "^6.38.0",
    "axios": "^1.15.0"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "jest": "^29.x",
    "@testing-library/react": "^14.x"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "jest",
    "lint": "eslint ."
  }
}
```

**Key Dependencies Explained:**
- `react@19.2.1` — Latest React with concurrent features
- `@supabase/supabase-js@2.x` — Official Supabase client (auth + database + storage)
- `openai@6.38.0` — Official OpenAI SDK for GPT API calls
- `axios@1.15.0` — HTTP client used by apiService for Modal/backend calls

## jest.config.js

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',  // Resolve @ path aliases
    '\\.(png|jpg|svg)$': '__mocks__/fileMock.js'  // Mock images
  }
};
```

**`testEnvironment: 'jsdom'`** — Simulates a browser DOM in Node.js so React components can be tested without a real browser.

## babel.config.js

Enables Jest to understand TypeScript and JSX syntax in test files. Jest uses Babel to transpile test code before running it.

---

# 14. THIRD-PARTY SERVICES

## Supabase

**What It Is:** Backend-as-a-Service providing PostgreSQL database, authentication, and file storage.

**Why Used:** Eliminates need to build and maintain a custom auth system, database server, and file storage infrastructure. Provides production-ready RLS security out of the box.

**Integration Points:**
- `supabaseClient.ts` — Initializes client with project URL and anon key
- `AuthContext.tsx` — Uses Supabase Auth SDK
- `storageService.ts` — Uses Supabase Database and Storage SDK

**Free Tier Limits:**
- 500MB database storage
- 1GB file storage
- 50,000 monthly active users
- 2 million API requests/month

## Vercel

**What It Is:** Hosting and deployment platform optimized for frontend frameworks.

**Why Used:** 
- Zero-config deployment for Vite/React apps
- Automatic HTTPS
- Global CDN for fast loading worldwide
- Git integration (push to deploy)
- Free tier sufficient for FYP/demo

**Integration:** `vercel.json` configuration file tells Vercel how to build and serve the app.

## WeatherAPI.com

**What It Is:** REST API for weather data.

**Why Used:** Free tier provides 1 million requests/month. Simple to integrate.

**Integration:** `useWeather.ts` hook makes fetch calls to the API.

---

# 15. SECURITY OVERVIEW

## Authentication Security

1. **Password Hashing:** Supabase handles password hashing (bcrypt) server-side. The frontend never receives or stores plain passwords.

2. **JWT Tokens:** Sessions are represented as JWTs. They expire automatically and are refreshed silently by the Supabase client.

3. **PKCE Flow for OAuth:** Google OAuth uses PKCE (Proof Key for Code Exchange) to prevent authorization code interception attacks.

## Database Security (RLS)

Row-Level Security is the primary database security mechanism:

```
Without RLS:
  SELECT * FROM tryon_history
  → Returns ALL users' history (data breach!)

With RLS enabled:
  SELECT * FROM tryon_history
  → Supabase appends: WHERE user_id = auth.uid()
  → Only returns current user's history
```

RLS is enforced on the database server, not in application code. Even if there's a bug in the frontend, users cannot access other users' data.

## Storage Security

- Storage bucket is public for reading (enabling social sharing)
- Writing is restricted: users can only write to `{their-own-uuid}/...` paths
- The storage policy checks `split_part(name, '/', 1) = auth.uid()`

## API Key Security

- `OPENAI_API_KEY` must be kept private (server-side only in production)
- Supabase `ANON_KEY` is designed to be public — RLS restricts its capabilities
- Hardcoding keys in `supabaseClient.ts` is acceptable for the anon key (public by design)
- Other API keys should be in environment variables, never committed to git

## Input Validation

- Auth forms validate email format and password length client-side
- Supabase's auth system validates on the server as well
- Image uploads are validated by CameraCapture (file type, size limits)

---

# 16. COMMON ERRORS & DEBUGGING GUIDE

## Auth Errors

### "Invalid login credentials"
**Cause:** Wrong email or password
**Fix:** Show user-friendly error message. Check if user registered with Google (would have no password).

### "User already registered"
**Cause:** Email already in the database
**Fix:** Show "Already have an account? Login" message.

### "Email not confirmed"
**Cause:** User registered but didn't click verification email
**Fix:** Supabase can be configured to skip email confirmation for development: Dashboard → Auth → Settings → disable "Email Confirmations"

### Google OAuth redirect mismatch
**Cause:** Google OAuth app settings don't include the current domain in allowed redirect URIs
**Fix:** Supabase Dashboard → Auth → URL Configuration → add site URL. Google Cloud Console → OAuth credentials → add redirect URI.

## Supabase Database Errors

### "permission denied for table profiles"
**Cause:** RLS enabled but no policy allows the operation, OR user not authenticated
**Fix:** Check RLS policies in Supabase Dashboard → Table Editor → Policies tab

### "violates row-level security policy"
**Cause:** Trying to insert data where `id` or `user_id` doesn't match `auth.uid()`
**Fix:** Ensure the user's UUID is passed correctly (use `user.id` from AuthContext, not a hardcoded value)

### Profile not found (null) on first login
**Cause:** The auto-create trigger isn't set up
**Fix:** Create the trigger manually in Supabase SQL editor (see Section 8, Supabase Setup SQL Script)

## Storage Errors

### "Bucket not found"
**Cause:** The `tryons` bucket doesn't exist in Supabase Storage
**Fix:** Create it manually: Supabase Dashboard → Storage → New Bucket → name: "tryons" → Public

### Upload fails silently
**Cause:** Storage RLS policy blocking the upload
**Fix:** Check storage policies. Ensure user is authenticated before uploading.

## Frontend Build Errors

### "Cannot find module '@/services/apiService'"
**Cause:** Path aliases not configured in tsconfig.json and vite.config.ts
**Fix:** Check both files have the `@/*` → `src/*` mapping

### "process is not defined" in browser
**Cause:** Node.js-specific code trying to run in browser
**Fix:** Use `import.meta.env.VAR_NAME` instead of `process.env.VAR_NAME` in Vite apps

### Vite build fails: "type error"
**Cause:** TypeScript type errors
**Fix:** Run `npx tsc --noEmit` to see all type errors without building

## Runtime Errors

### Try-On job stuck at 'processing' indefinitely
**Cause:** Modal service not responding, or timeout exceeded
**Fix:** The AppContext sets status to 'failed' after timeout. Check Modal dashboard for service health. Modal cold starts can take 2-3 minutes.

### Weather shows wrong location
**Cause:** Browser denying geolocation permission
**Fix:** This is expected fallback behavior. The IP-based weather as initial fallback is working correctly.

---

# 17. SETUP GUIDE

## Prerequisites
- Node.js 18+ and npm
- Supabase account (free)
- OpenAI API key (required)
- WeatherAPI.com API key
- (Optional) Modal account for GPU service

## Step 1: Clone and Install
```bash
git clone <repo-url>
cd Style-Sense-Main
npm install
```

## Step 2: Set Up Supabase
1. Go to https://supabase.com → New Project
2. Copy the Project URL and Anon Key
3. Update `src/lib/supabaseClient.ts` with your project credentials
4. In Supabase SQL editor, run the SQL from `SUPABASE_SETUP.md`
5. Create `tryons` storage bucket (public)

## Step 3: Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local:
OPENAI_API_KEY=sk-...
VITE_MODAL_URL=https://...  # from Modal deployment
```

## Step 4: Configure Google OAuth (Optional)
1. Google Cloud Console → Credentials → OAuth 2.0 Client IDs
2. Add your domain to Authorized Redirect URIs
3. Supabase Dashboard → Auth → Providers → Enable Google → paste Client ID + Secret

## Step 5: Run Locally
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (optional for local try-on)
cd backend
npm install
npm start
```

## Step 6: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

---

# 18. VIVA / FYP PREPARATION

## BEGINNER QUESTIONS

---

**Q1: What is StyleSense.AI? Explain it in simple terms.**

**Answer:** StyleSense.AI is an AI-powered personal fashion assistant web application. Users can:
1. Complete a style quiz about their body type and preferences
2. Get personalized clothing recommendations based on their profile and current weather
3. Virtually "try on" clothes using AI that generates an image of them wearing the garment
4. Chat with an AI assistant for styling advice

**Viva Answer:** "StyleSense.AI is a fashion tech application that combines personalization, AI recommendations, and virtual try-on technology to help users discover and visualize outfits before purchasing."

---

**Q2: What technology did you use to build the frontend?**

**Answer:** 
- **React 19** — JavaScript library for building UI components
- **TypeScript** — Typed superset of JavaScript that catches bugs at compile time
- **Vite** — Modern build tool (faster than Create React App)
- **Tailwind CSS** — Utility-first CSS framework for styling
- Hosted on **Vercel**

**Viva Answer:** "The frontend is built with React 19 and TypeScript, bundled with Vite, styled with Tailwind CSS, and deployed on Vercel."

---

**Q3: What is Supabase and why did you use it?**

**Answer:** Supabase is an open-source Backend-as-a-Service that provides:
- **PostgreSQL database** — Stores user profiles, try-on history, and feedback
- **Authentication** — Email/password and Google OAuth login
- **Storage** — Cloud storage for try-on result images

We used it because it eliminates the need to build and host a custom database server and auth system, saving weeks of development time. It's also free for small-scale projects.

**Viva Answer:** "Supabase gives us a production-ready PostgreSQL database, authentication, and file storage in one platform. We chose it for rapid development and its built-in Row-Level Security for data privacy."

---

**Q4: What is Row-Level Security (RLS)?**

**Answer:** RLS is a PostgreSQL feature where database access is automatically filtered based on who is making the request. 

Example: When User A queries `SELECT * FROM tryon_history`, PostgreSQL automatically adds a filter `WHERE user_id = User_A_UUID`. User A can never see User B's try-on history, even if there's a bug in the application code.

In Supabase, this is configured using SQL policies that define what each user can see/do.

**Viva Answer:** "RLS is a database-level security mechanism that automatically filters query results to only show data belonging to the authenticated user. It's enforced by the database server, not the application code, making it tamper-proof."

---

**Q5: How does user authentication work?**

**Answer:** 
1. User submits email + password on the login form
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase verifies credentials and returns a JWT session token
4. Supabase stores the session in localStorage for persistence
5. On subsequent visits, the session is automatically restored
6. When the session expires, Supabase silently refreshes it
7. All API calls include the JWT in headers → Supabase verifies identity

**Viva Answer:** "Authentication uses Supabase Auth. Users log in with email/password or Google OAuth. Supabase issues JWT tokens which are stored in localStorage and automatically refreshed. The JWT is attached to every database request, enabling Row-Level Security to identify the user."

---

**Q6: What is the Style Quiz and why is it important?**

**Answer:** The style quiz collects user data including vibe (Casual/Formal/Sporty), body type, measurements (height, bust, waist, hips), preferred season, and occasion. This data is stored in the `profiles` table as JSON.

It's important because:
1. **ML Recommendations:** The TF-IDF recommendation engine uses vibe and occasion as query terms
2. **AI Chat Context:** The GPT chatbot receives quiz data as context for personalized advice
3. **Weather Filtering:** Season preference combined with weather data filters recommendations
4. **Body Visualization:** Measurements inform the virtual try-on quality

**Viva Answer:** "The style quiz is the personalization foundation. It collects body measurements and style preferences which are used by the ML recommendation engine, sent as context to the AI chatbot, and used to filter weather-appropriate suggestions."

---

**Q7: Where are the try-on result images stored?**

**Answer:** In Supabase Storage. Specifically:
- **Bucket:** `tryons` (public)
- **Path:** `{userId}/{timestamp}.png`
- **Example:** `tryons/abc-123/1703001234567.png`

The public URL format is: `https://heliemugpbhlyzbagnrp.supabase.co/storage/v1/object/public/tryons/{userId}/{timestamp}.png`

This URL is stored in the `tryon_history` table's `image_url` column for reference.

**Viva Answer:** "Try-on images are uploaded to Supabase Storage in a public bucket called 'tryons', organized by user ID folder. The public URL is stored in the database so images can be displayed in the app and shared on social media."

---

## INTERMEDIATE QUESTIONS

---

**Q8: Explain React Context and why you used it instead of Redux.**

**Answer:** React Context is a built-in React API for sharing state across components without "prop drilling" (passing props through many intermediate components).

We used two contexts:
- `AuthContext` — User session and auth functions
- `AppContext` — Quiz data, try-on jobs, weather, products, theme

We chose Context over Redux because:
1. The state complexity is manageable without Redux's extra boilerplate
2. No time-travel debugging or middleware needed for this use case
3. Context is built into React — one fewer dependency
4. Simpler mental model for academic context

**Viva Answer:** "We use React Context API for global state management. AuthContext handles authentication state and AppContext manages all app-level state including quiz data, try-on jobs, and the product catalog. We chose Context over Redux to reduce complexity since our state requirements don't need Redux's advanced features like middleware or time-travel debugging."

---

**Q9: Walk me through the complete try-on job flow from button click to result display.**

**Answer:**
```
1. User clicks "Generate Try-On" in VirtualTryOn.tsx
2. VirtualTryOn calls AppContext.startTryOnJob(personImage, garment, garmentName)
3. AppContext creates a new TryOnJob object with status='processing' and unique ID
4. Job is added to tryOnJobs array → UI shows "Processing..." spinner
5. Background processing:
   a. Person image converted from File to base64 string (FileReader)
   b. apiService.detectGarmentCategory() called → returns 'upper_body'|'lower_body'|'dresses'
   c. apiService.performVitonHDTryOn() called → sends to Modal GPU (up to 11 min)
   d. Modal runs OOTDiffusion → returns base64 result image
6. Result image converted: base64 → Blob → File
7. storageService.uploadTryOnImage() → uploads to Supabase Storage → gets public URL
8. storageService.saveTryOnRecord() → inserts row in tryon_history table
9. Job status updated to 'completed', resultImageUrl stored
10. CreationsPanel (subscribed to tryOnJobs) re-renders → shows result image
```

**Viva Answer:** "When a user initiates a try-on, AppContext manages the entire async pipeline: it converts images to base64, detects the garment category, proxies through Express to the Modal GPU service where OOTDiffusion runs, then uploads the result to Supabase Storage and records the attempt in the database. The UI reactively updates at each step."

---

**Q10: How does dark mode work in the application?**

**Answer:** 
- `isDarkMode` boolean is in `AppContext`
- When toggled, it adds/removes the `dark` class on the `<html>` element
- Tailwind CSS has a `darkMode: 'class'` configuration
- Components use dual classes: `bg-white dark:bg-gray-900`
- When `dark` class is on the root element, all `dark:` prefixed classes activate

The user's dark mode preference is persisted in localStorage so it survives page refreshes.

---

**Q11: What is TypeScript and how does it improve code quality?**

**Answer:** TypeScript is a "typed" superset of JavaScript. It adds a type system that catches errors before the code runs.

Benefits in this project:
1. **Interface definitions in types.ts:** All data shapes (TryOnJob, Product, QuizDetails) are explicitly defined. If you pass the wrong data, TypeScript flags it immediately.
2. **Autocomplete:** IDE shows available properties on objects.
3. **Refactoring safety:** Renaming a function/property propagates the change everywhere TypeScript tracked it.
4. **Null safety:** TypeScript forces you to handle `user | null` states, preventing "cannot read property of undefined" crashes.

**Viva Answer:** "TypeScript adds static type checking to JavaScript. Our `types.ts` file defines interfaces for all data structures. This catches type mismatches at compile time, provides IDE autocomplete, and prevents null pointer errors — significantly reducing runtime bugs."

---

**Q12: Explain the Vite build process and what ends up in the `dist/` folder.**

**Answer:**
1. `npm run build` runs TypeScript compiler (`tsc`) then Vite's Rollup bundler
2. TypeScript is compiled to JavaScript
3. All imports are resolved and bundled together
4. Code splitting produces separate chunks (react, supabase, openai, ml-data)
5. Each chunk gets a content hash in its filename (e.g., `vendor-react-abc123.js`)
6. `dist/index.html` references these hashed files
7. Vercel serves `dist/` via CDN

The content hash means: if React's code hasn't changed, browsers use the cached version. Only changed code needs re-downloading.

---

**Q13: How does the weather integration work? What happens if geolocation is denied?**

**Answer:** The `useWeather` hook implements a three-level fallback strategy:

**Level 1 (Instant, ~0ms):** On mount, immediately fetch weather using IP geolocation (`https://api.weatherapi.com/v1/current.json?q=auto:ip`). This shows approximate weather instantly without permission.

**Level 2 (Accurate, user permission required):** In parallel, request `navigator.geolocation.getCurrentPosition()`. If granted (typically within 5 seconds), fetch weather with precise coordinates, updating Level 1's data.

**Level 3 (Fallback):** If both fail (denied permission + IP lookup fails), show empty weather state — the app continues working without weather.

**Business Relevance:** The instant IP fallback means users always see some weather data, making the feature feel fast. The geolocation upgrade improves accuracy if the user consents.

---

## ADVANCED QUESTIONS

---

**Q14: What security vulnerability exists with storing API keys in the frontend? How should it be properly solved?**

**Answer:** **Problem:** The `OPENAI_API_KEY` in `.env.local` gets bundled into the JavaScript that runs in the user's browser. Anyone with browser DevTools can inspect the network requests or the bundle and extract the key. This could lead to unauthorized API usage and unexpected billing.

**Proper Solution:** 
1. Move OpenAI API calls to the Express backend (server-side)
2. Frontend calls `/api/chat` → Express calls OpenAI → returns response
3. The API key is only on the server, never in browser code
4. Add rate limiting on the backend endpoint to prevent abuse

**Current Mitigation:** The project includes an Express backend that could be used for this purpose. For FYP/demo purposes with a test API key, the risk is acceptable.

**Viva Answer:** "Ideally, API keys should never be in frontend code as they can be extracted from the browser bundle. The proper solution is to proxy all third-party API calls through the Express backend. The project's backend infrastructure is already set up for this — it's an architectural improvement we'd make before production at scale."

---

**Q15: How does Supabase's realtime feature work, and is it used in this project?**

**Answer:** Supabase Realtime uses WebSockets to subscribe to database changes. Example:
```typescript
supabase.channel('tryon_history').on('postgres_changes', { event: 'INSERT', table: 'tryon_history' }, (payload) => {
  // Update UI with new record
}).subscribe();
```

**In this project:** Realtime is NOT currently used. Try-on job state is managed entirely in React state (AppContext). This is fine for a single-user session. For a multi-device scenario (try-on on mobile, view on desktop), realtime would be needed.

**Potential Enhancement:** Subscribe to `tryon_history` changes so the job completes on one device and automatically appears on another.

---

**Q16: How would you scale the frontend to support 10,000 concurrent users?**

**Answer:**
1. **Vercel CDN:** Already handled — static files are served from edge locations globally, no change needed
2. **Supabase scaling:** Upgrade from free tier to Pro (10,000+ connections via PgBouncer connection pooling)
3. **Image optimization:** Add `sharp` (or Vercel's built-in image optimization) to compress try-on images before storage
4. **Lazy loading:** Currently all components load upfront. Code-split each tab route so Dashboard doesn't load StyleChatbot code until needed
5. **Caching:** Add React Query or SWR for server-state caching (avoid re-fetching profile on every render)
6. **CDN for model data:** Move `modelParams.json` to a CDN edge cache since it never changes

---

## MODULE-SPECIFIC QUESTIONS (Frontend/Auth/DB)

---

**Q17: Why is the Supabase anon key hardcoded in supabaseClient.ts instead of in an environment variable?**

**Answer:** The anon key is specifically designed to be public. From Supabase's documentation: "The anon key is safe to use in browser-side code. It only has access to data that is public (via RLS policies), and can only access data that you explicitly allow."

All sensitive operations are protected by RLS. The anon key alone cannot bypass policies. It's similar to how a public API key (like a Google Maps API key) is used in frontend code — you still restrict it via domain allowlisting and usage policies.

That said, for maximum security, it's still best practice to use environment variables even for the anon key, so you can rotate it without a code deploy.

---

**Q18: What happens in the database when a user deletes their account?**

**Answer:** Three `ON DELETE` behaviors are configured:
- `profiles` — `ON DELETE CASCADE` → Profile row automatically deleted
- `tryon_history` — `ON DELETE CASCADE` → All try-on records deleted
- `feedback` — `ON DELETE SET NULL` → Feedback stays, `user_id` set to NULL

The feedback data is preserved for aggregate analytics (e.g., average rating across all users) even after the user is gone. The personal data (profile, history) is removed, respecting GDPR-like data deletion requirements.

---

**Q19: Explain how React's re-rendering works with Context. Are there performance concerns?**

**Answer:** When any value in a Context changes, ALL components that `useContext` that context will re-render.

**Potential Problem:** `AppContext` holds many pieces of state. If `weather` updates, components only using `quizDetails` will also re-render unnecessarily.

**Current State:** For an FYP-scale app (dozens of concurrent users), this is acceptable. The re-renders are fast.

**Optimization if Needed:**
1. Split AppContext into smaller contexts (WeatherContext, JobsContext, QuizContext)
2. Use `React.memo()` on components that only need their props to re-render
3. Use `useMemo()` for expensive derived values

---

**Q20: How would you implement pagination for try-on history as the history grows?**

**Answer:** Currently, `fetchUserTryOnHistory()` fetches ALL records:
```typescript
supabase.from('tryon_history').select('*').eq('user_id', userId).order('created_at', desc)
```

**With Pagination:**
```typescript
const PAGE_SIZE = 10;
supabase.from('tryon_history')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

Supabase's `.range()` uses SQL `LIMIT/OFFSET` under the hood. The CreationsPanel would show a "Load More" button or infinite scroll.

---

## AI/ML QUESTIONS (Frontend Perspective)

---

**Q21: How does the ML recommendation engine get invoked from the frontend?**

**Answer:** The ML engine runs entirely in the browser. `mlRecommend.ts` is imported into `geminiService.ts`. When the user types a query in OutfitGenerator or views the Dashboard:

1. `geminiService.findMatchingOutfits(query, products)` is called
2. Inside, `mlRecommend(query, products, topK)` is called
3. This runs the TF-IDF → SVD → cosine similarity pipeline on the user's device
4. Results are passed to OpenAI's GPT to format into natural language
5. Formatted recommendations are returned to the component

**Why Browser-Side ML?** The `modelParams.json` is only 30 items — the entire computation takes milliseconds. No server round-trip needed.

---

**Q22: What happens if the OpenAI API is unavailable?**

**Answer:** The app has partial fallback:
- **Chat:** `huggingFaceService.ts` with Mistral-7B is the fallback (controlled by `USE_GEMINI_CHATBOT` flag in constants.ts)
- **Outfit search:** Falls back to pure ML recommendation (keyword matching) without natural language formatting
- **Image validation:** Non-blocking — if validation fails, the try-on still proceeds
- **Social captions:** The sharing feature simply won't show AI captions

**Viva Answer:** "We designed graceful degradation. The HuggingFace Mistral-7B fallback handles chatbot failures. Core features like the ML recommendations and virtual try-on don't depend on OpenAI, so the app remains functional even if the chat AI is unavailable."

---

## DATABASE QUESTIONS

---

**Q23: Why did you choose PostgreSQL (via Supabase) over a NoSQL database like MongoDB?**

**Answer:**
1. **Relational data:** Users have profiles, history, and feedback — these have clear relationships
2. **ACID compliance:** Ensures data consistency (a try-on record is never half-written)
3. **RLS:** PostgreSQL's Row-Level Security is a powerful built-in feature that's unique to SQL databases
4. **JSONB flexibility:** We get the best of both worlds — structured tables with a flexible JSONB column for quiz data
5. **Supabase's SQL editor:** Makes schema management easy with version-controllable SQL scripts

---

**Q24: What is the purpose of `uuid_generate_v4()` as the default for primary keys?**

**Answer:** UUIDs (Universally Unique Identifiers) are randomly generated 128-bit identifiers. Using them instead of sequential integers (1, 2, 3...) provides:
1. **Security:** Can't enumerate records (can't guess ID 5 by knowing ID 4 exists)
2. **Distributed safety:** If you ever merge data from multiple databases, UUIDs won't conflict
3. **Frontend pre-generation:** The frontend can generate the UUID for a new record before sending it to the server (useful for optimistic UI updates)

---

## DEPLOYMENT QUESTIONS

---

**Q25: How does Vercel's rewrite rule make React Router work?**

**Answer:** React Router is a client-side router. When you visit `https://stylesense.ai/dashboard` directly (not through navigation), the browser asks Vercel's server for `/dashboard`. Without a rewrite rule, Vercel would return 404 because there's no `dashboard.html` file.

The rewrite rule `{ "source": "/(.*)", "destination": "/index.html" }` tells Vercel: "For ANY path, serve `index.html`." The React app loads, reads `window.location.pathname`, and React Router's code renders the correct component for `/dashboard`.

**Viva Answer:** "Vercel's catch-all rewrite rule sends all requests to `index.html`. React then reads the URL client-side and React Router renders the correct component. Without this rule, direct URL access or page refresh on any non-root route would return 404."

---

**Q26: What is the purpose of content hashing in the build output filenames?**

**Answer:** Files like `vendor-react-Bx7k9Qrt.js` include a hash of the file's content. 

- When React's code doesn't change between deployments, the hash stays the same → browsers use their cached version (no download)
- When the app code changes, only the changed chunk gets a new hash → browsers only re-download changed code
- Without hashing, browsers might cache old files even after a deployment

This is called "cache busting." It provides long cache lifetimes without serving stale code.

---

*End of Usman's Documentation*
