# Chat Evaluation Application

## Overview

This is a full-stack TypeScript application designed for evaluating AI chat responses. Users can submit prompts to an AI assistant and then rate the responses across multiple criteria. The application features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for request/response validation
- **External Services**: OpenAI API integration for chat responses

### Database Design
The application uses a relational database structure with four main entities:
- **Users**: User authentication and identification
- **Tasks**: Evaluation sessions with turn limits
- **Conversations**: Individual prompt-response pairs
- **Ratings**: Multi-criteria ratings for AI responses

## Key Components

### Data Storage
- **Primary Storage**: PostgreSQL database via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management
- **Fallback**: In-memory storage implementation for development

### Authentication
- Session-based authentication (infrastructure present but not fully implemented)
- User management system designed for future expansion

### AI Integration
- OpenAI GPT-3.5-turbo integration for generating chat responses
- Response length limiting (500 words maximum)
- Error handling and fallback responses

### Rating System
Five-criteria evaluation system:
- Accuracy: Information precision
- Clarity: Explanation clarity
- Relevance: Prompt relevance
- Consistency: Information consistency
- Completeness: Response completeness

## Data Flow

1. **Task Creation**: User starts a new evaluation session
2. **Prompt Submission**: User submits a prompt (max 60 words)
3. **AI Response**: System calls OpenAI API and stores conversation
4. **Rating Collection**: User evaluates response across five criteria
5. **Task Completion**: After 3 turns, user can complete the task

### API Endpoints
- `POST /api/tasks` - Create new evaluation task
- `GET /api/tasks/:id` - Retrieve task with conversations and ratings
- `POST /api/chat` - Submit prompt and get AI response
- `POST /api/ratings` - Submit ratings for a conversation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM
- **openai**: Official OpenAI API client
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Development
- Vite dev server for frontend hot reloading
- tsx for backend development with TypeScript
- Environment variables for API keys and database URLs

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- esbuild compiles backend TypeScript to `dist/index.js`
- Single deployment artifact serving both frontend and API

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `NODE_ENV`: Environment specification

The application is designed for seamless deployment on platforms like Replit, with automatic asset serving and API proxying configured through Vite's middleware system.

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
- June 28, 2025. Implemented chat flow with click-to-rate system:
  * Replaced section navigation with natural chat flow interface
  * Removed arrow navigation buttons as requested
  * Chat displays all conversations chronologically (max 3 turns)
  * Click on any AI response to open rating panel on the right
  * Rating system appears only when clicking specific responses
  * 5 criteria: Accuracy, Completeness, Relevance, Clarity, Consistency (1-5 scale)
  * Text input disabled after 3 turns to enforce turn limit
  * Submit button appears only after 3 turns for task completion
  * Natural conversation flow with contextual follow-up prompts
- June 28, 2025. Added independent rating system:
  * Each AI response now has its own independent rating menu
  * Draft ratings persist when switching between conversations
  * Shows empty state for unrated responses, previous values for rated ones
  * Rating menu resets properly when clicking different AI responses
- June 28, 2025. Implemented context chaining:
  * Each new prompt automatically includes previous AI response in background
  * User interface shows only original prompts and responses
  * Backend concatenates previous AI response with new prompt before sending to OpenAI
  * Maintains conversation context across turns for better AI responses
- June 29, 2025. Enhanced dashboard and UI improvements:
  * Fixed "Additional Comments" input bug - spaces now work properly in textarea
  * Added "Average Time Per Task" metric to tasker dashboard (shows 8.5 min when tasks completed, 0 when none)
  * Restructured tasker dashboard with 3 cards: Tasks Completed, Avg Time Per Task, Total Earnings
  * Total Earnings now shows $0.00 when no tasks completed instead of empty state
  * Added "Exit" button to chat evaluation page for easy navigation back to dashboard
  * Improved responsive layout with proper card spacing
- June 29, 2025. Implemented auto-save rating system and task numbering fix:
  * Auto-saves ratings to server when all 5 criteria are filled for each conversation
  * Complete Evaluation button requires all 15 values (5 criteria × 3 conversations) before becoming clickable
  * Added server-side rating update functionality to prevent duplicate ratings
  * Fixed admin task numbering to show sequential Task #1, Task #2, Task #3 instead of database IDs
  * Ratings now properly transfer from tasker view to admin "View Results" section
- June 29, 2025. Added admin edit functionality and UI improvements:
  * Removed "Progress" text from admin View Results dialog, replaced with Status display
  * Changed "Created" label to "Updated" in task details
  * Added edit buttons for AI responses, rating values (5 columns), and additional comments
  * Implemented inline editing with save/cancel functionality for all editable fields
  * Added server-side API endpoints for updating conversations and ratings
  * Edit functionality works independently for each conversation turn
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```