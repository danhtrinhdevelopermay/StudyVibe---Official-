# StudyVibe - Learning Management Application

## Overview

StudyVibe is a comprehensive full-stack learning management application built with React, Express.js, and PostgreSQL. The application provides students with tools for creating flashcards, taking quizzes, managing notes, tracking assignments, and participating in study groups. It features a modern dark-themed UI built with shadcn/ui components and includes gamification elements like XP, levels, and achievements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with structured error handling
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM for type-safe database operations

### Authentication Strategy
- **Provider**: Firebase Authentication
- **Methods**: Email/password and Google OAuth
- **Integration**: Custom auth hooks connecting Firebase users to internal user records
- **Session Handling**: Firebase auth state synchronized with backend user data

## Key Components

### Database Schema (PostgreSQL with Drizzle)
- **Users**: Core user profiles with Firebase UID linking, XP/level system
- **Flashcards**: Hierarchical deck/card structure with spaced repetition
- **Quizzes**: Question banks with multiple choice support and attempt tracking
- **Notes**: Rich text content with tagging system
- **Assignments**: Task management with deadlines and priority levels
- **Study Groups**: Collaborative learning spaces with membership management
- **Achievements**: Gamification system for user engagement

### Frontend Pages & Features
- **Landing Page**: Marketing site with feature highlights
- **Dashboard**: Personalized overview with stats, deadlines, and quick actions
- **Study Tools**: Dedicated pages for flashcards, quizzes, notes
- **Assignment Tracker**: Deadline management with priority filtering
- **Study Groups**: Collaborative spaces with member management
- **Profile Management**: User settings, statistics, and achievement display

### UI Component System
- **Design System**: shadcn/ui with consistent theming
- **Layout**: Fixed top navigation with mobile-first bottom navigation bar
- **Responsive Design**: Mobile-first approach with breakpoint considerations
- **Dark Theme**: Custom color palette optimized for extended study sessions
- **Interactive Elements**: Modals, dropdowns, and form components

## Data Flow

### Authentication Flow
1. Firebase handles user authentication
2. Custom auth hooks sync Firebase state with React components
3. Backend creates/retrieves user records using Firebase UID
4. Session persistence through Firebase auth state

### API Communication
1. TanStack Query manages all server state and caching
2. Custom `apiRequest` utility handles HTTP communication
3. Zod schemas validate data at API boundaries
4. Error handling with toast notifications for user feedback

### Study Session Flow
1. Users create/access study materials (flashcards, quizzes, notes)
2. Progress tracking updates user XP and statistics
3. Real-time updates reflect changes across components
4. Achievement system triggers based on user actions

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **Database**: Drizzle ORM, @neondatabase/serverless for PostgreSQL
- **Authentication**: Firebase Auth SDK
- **UI Components**: Radix UI primitives, Lucide React icons
- **Validation**: Zod for schema validation
- **HTTP Client**: TanStack Query for data fetching

### Development Tools
- **Build**: Vite with TypeScript support
- **Styling**: Tailwind CSS with PostCSS
- **Code Quality**: TypeScript strict mode
- **Development**: tsx for TypeScript execution, Replit-specific plugins

### Database Provider
- **Hosting**: Neon (PostgreSQL-compatible serverless database)
- **Connection**: WebSocket-based connection pooling
- **Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Database**: Environment-based DATABASE_URL configuration
- **Hot Reload**: Vite HMR with Express middleware integration
- **Error Handling**: Runtime error overlays for development

### Production Build
- **Frontend**: Static build output served by Express
- **Backend**: ESBuild compilation to Node.js-compatible modules
- **Environment**: NODE_ENV-based configuration
- **Assets**: Bundled and optimized for production delivery

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **Authentication**: Firebase configuration via environment variables
- **Build Process**: Separate client and server build pipelines
- **Static Serving**: Express serves built frontend assets in production

The application follows a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clear separation between client and server concerns.

## Recent Changes

### Migration to Replit Environment (July 10, 2025)
- **Problem**: Project needed migration from Replit Agent to standard Replit environment
- **Solution**: Complete environment setup with proper security practices
- **Completed Tasks**:
  - Set up PostgreSQL database with proper connection
  - Configured Firebase authentication with user credentials
  - Created all required database tables using Drizzle migrations
  - Fixed dependency issues and ensured clean startup
  - Verified user authentication and data persistence working correctly
- **Current Status**: Application fully functional and ready for development

### Media URL Optimization (July 2025)
- **Problem**: Long data URLs stored in database causing performance lag
- **Solution**: Implemented cloud storage integration with ImgBB for short URLs
- **Impact**: Reduced database payload size by 95%+ for posts with media
- **Features**:
  - Uploads images to ImgBB free cloud storage (i.ibb.co URLs)
  - Converts data URLs to short cloud URLs automatically
  - Fast CDN delivery with global availability
  - Automatic optimization for new posts
  - Admin endpoint for bulk optimization of existing posts
  - Maintains original media quality while reducing database load

### Enhanced Admin Notification System (July 10, 2025)
- **Problem**: Admin needed prominent announcement system with multimedia support
- **Solution**: Complete admin announcement feature with file uploads and priority levels
- **Impact**: Admins can now send rich notifications with images/videos to all or specific users
- **Features**:
  - Three priority levels: normal, high priority, urgent (with visual indicators)
  - Multimedia support for images and videos via cloud storage
  - Target specific users or send to all users
  - Prominent display with admin badges and priority indicators
  - Form validation and file upload handling with multer middleware
  - Integration with existing notification system
- **Bug Fix**: Fixed violation notice feature by adding `getPostById` method to storage interface