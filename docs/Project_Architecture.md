# StyleSense.AI: Project Architecture

## 1. Introduction

This document provides a detailed technical overview of the StyleSense.AI application. It is intended for developers and project stakeholders to understand the system's architecture, technology stack, data flow, and core component logic.

StyleSense.AI is an AI-powered fashion assistant designed to provide a seamless and personalized styling experience. It integrates several cutting-edge AI models to deliver features like virtual try-on, personalized recommendations, and natural language-based outfit discovery.

---

## 2. Technology Stack

The application is built on a modern, robust technology stack chosen for performance, scalability, and developer experience.

| Technology              | Role                                                                          | Justification                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **React**               | Frontend Library                                                              | Component-based architecture for building a modular and maintainable UI.                                  |
| **TypeScript**          | Language                                                                      | Adds static typing to JavaScript, reducing bugs and improving code quality and developer experience.      |
| **Tailwind CSS**        | CSS Framework                                                                 | A utility-first approach for rapid and consistent UI development without leaving the HTML.                |
| **Supabase**            | Backend-as-a-Service                                                          | Provides authentication (Auth), database (Postgres), and storage, accelerating backend development.       |
| **@google/genai**       | AI SDK                                                                        | Powers natural language understanding for the Outfit Finder, Style Chatbot, and caption generation.       |
| **VITON-HD (Gradio)**   | AI Model Service                                                              | Provides the core, high-fidelity virtual try-on functionality via a hosted Gradio API endpoint.         |
| **Jest & RTL**          | Testing Framework                                                             | The standard for unit and component testing in React, ensuring code reliability and correctness.          |

---

## 3. Folder Structure

The project follows a feature-oriented structure to keep related files organized and maintainable.

```
/
├── __mocks__/              # Mocks for Jest tests (e.g., file assets)
├── __tests__/              # Unit and integration test files
├── components/             # Reusable React components
│   ├── Auth/               # Authentication-related components (Login, Register)
│   ├── Creations/          # Components for the "My Creations" panel
│   ├── Feedback/           # Feedback form component
│   └── Share/              # Social media sharing modal
├── contexts/               # React Context providers for global state
├── docs/                   # Project documentation (like this file)
├── hooks/                  # Custom React hooks (e.g., useWeather)
├── lib/                    # Library initializations (e.g., Supabase client)
├── services/               # Modules for external API interactions
├── types.ts                # Global TypeScript type definitions
├── config.ts               # Centralized API keys and configuration
├── App.tsx                 # Main application component and routing logic
├── index.html              # The single HTML entry point
├── index.tsx               # The root React render entry point
├── jest.config.js          # Jest test runner configuration
└── ...                     # Other configuration files
```

---

## 4. Core Concepts & Data Flow

### 4.1. State Management (React Context)

Global application state is managed using the React Context API, avoiding the need for a heavier state management library like Redux for this project's scope.

-   **`AuthContext`**: Manages user authentication state, including the current `user` and `session`. It wraps the entire application and handles communication with Supabase Auth for login, registration, and session management.
-   **`AppContext`**: Manages all other shared application states, such as weather data, style quiz results, and the virtual try-on job queue. This centralizes business logic and makes state accessible to any component that needs it.

### 4.2. Configuration Management

All external API keys (Supabase, Gemini, WeatherAPI, etc.) are managed in a central `config.ts` file. This prevents keys from being scattered across the codebase and ensures that services fail gracefully with clear error messages if a key has not been configured.

### 4.3. Authentication Flow

1.  **Initial Load**: `AuthContext` initializes and listens for auth state changes from Supabase. A loading state is shown.
2.  **Session Check**: Supabase's `onAuthStateChange` immediately fires with the current session. If a valid session exists, the user is considered logged in.
3.  **Login/Register**: If no session exists, `AuthPage` is displayed. The `LoginForm` and `RegisterForm` components use functions from `AuthContext` to call Supabase's `signInWithPassword` or `signUp` methods.
4.  **State Update**: Upon a successful auth event, `onAuthStateChange` fires again, updating the context with the new session and user data, which re-renders the app to show the `MainApp` component.
5.  **Logout**: The `logout` function in `AuthContext` calls `supabase.auth.signOut()`, which triggers the listener and returns the user to the `AuthPage`.

### 4.4. Virtual Try-On (Asynchronous Job Processing)

This is the most complex user flow, designed to be non-blocking.

1.  **Initiation**: A user uploads their photo and selects a garment in the `VirtualTryOn` component.
2.  **Job Creation**: The `startTryOnJob` function in `AppContext` is called. It creates a new job object with a unique ID and `processing` status, immediately adding it to the `tryOnJobs` state array. This makes the new job instantly visible in the `CreationsPanel`.
3.  **API Call**: The context then calls `performVitonHDTryOn` from `apiService`. This function makes a `fetch` request to the VITON-HD Gradio endpoint. A 90-second timeout and retry logic are built into the UI to handle the unreliability of public AI services.
4.  **State Update (Success/Failure)**:
    -   On a successful response from the AI model, the `tryOnJobs` array is updated. The status of the corresponding job is changed to `completed`, and the `resultImage` (a base64 data URL) is added.
    -   If the API call fails (e.g., timeout, 404 error), the job's status is updated to `failed`, and an `error` message is stored.
5.  **UI Rendering**: Components like `JobItem` are subscribed to the `AppContext` and re-render automatically as the job status changes, showing a spinner, the final result, or an error message with a retry button.

---

## 5. AI & External Service Integrations

-   **`apiService.ts`**:
    -   `fetchRecommendations`: Retrieves product data from the public `fakestoreapi.com`. It filters out non-clothing items to ensure data quality.
    -   `performVitonHDTryOn`: The core of the virtual try-on feature. It communicates with a Gradio endpoint hosting the VITON-HD model.
        -   **Note on Reliability**: The application currently uses a public Hugging Face Space (`levihsu/VITON-HD`). These public endpoints are not guaranteed to be stable and may be taken down without notice, as has happened previously. For production use, a self-hosted model is strongly recommended (see `Backend_Deployment_Guide.md`).

-   **`geminiService.ts`**:
    -   Handles all interactions with the Google Gemini API.
    -   `findMatchingOutfits`: Implements a "semantic filter." It sends the user's natural language prompt and a simplified list of available outfits to the Gemini model, instructing it to return the best matches. This is more powerful than simple keyword search.
    -   `getGeminiChatResponse`: Provides the conversational AI for the `StyleChatbot`, leveraging user context (weather, quiz results) for personalized responses.
    -   `generateSocialMediaCaptions`: Generates creative, platform-specific captions for sharing try-on results.

-   **`huggingFaceService.ts`**:
    -   Provides an alternative chatbot backend using the Mistral-7B model via the Hugging Face Inference API. Controlled by a feature flag (`USE_GEMINI_CHATBOT`).

-   **`useWeather.ts`**:
    -   This custom hook encapsulates the logic for fetching real-time weather data. It uses the browser's `navigator.geolocation` to get the user's coordinates and then calls the WeatherAPI. It includes robust fallback logic for cases where geolocation is denied or the API key is missing.

---

## 6. Testing Strategy

The project employs a robust unit testing strategy using Jest and React Testing Library (RTL) to ensure the stability and correctness of the application.

-   **Philosophy**: Tests are written to verify functionality from a user's perspective rather than testing implementation details.
-   **Mocking**: External dependencies like `fetch` calls, the Supabase client, and the Gemini API are mocked to create a controlled and fast testing environment.
-   **Coverage**: Test suites cover critical areas:
    -   **Contexts (`AuthContext`, `AppContext`)**: To ensure reliable global state management.
    -   **Services (`apiService`, `geminiService`)**: To verify correct API request formatting and response handling (both success and error cases).
    -   **Hooks (`useWeather`)**: To test the hook's lifecycle and fallback logic.
    -   **Components (`Dashboard`, `Onboarding`, `CreationsPanel`, etc.)**: To verify that UI components render correctly in different states (loading, success, error) and respond to user interactions as expected.
-   **Configuration**: `jest.config.js` and `jest.setup.js` are configured to work with TypeScript, JSX, and to provide helpful DOM assertions via `@testing-library/jest-dom`.