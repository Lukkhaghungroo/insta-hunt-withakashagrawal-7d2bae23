# Instagram Lead Generator

## Overview

This application is a full-stack Instagram lead generation and management tool built with React, Express, and PostgreSQL. It enables users to extract, parse, clean, and manage Instagram profile data from various sources. The system includes advanced features like smart search functionality, follower count parsing, profile categorization, and comprehensive data management capabilities. The application provides tools for scraping session management, profile confidence scoring, and export functionality for marketing teams.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite**: Build tool and development server for fast hot reloading and optimized production builds
- **shadcn/ui Components**: Comprehensive UI component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design with dark mode support
- **TanStack Query**: Data fetching and state management for server state
- **React Router**: Client-side routing for navigation

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Zod**: Runtime type validation for API requests and responses
- **Session Management**: Express session handling with PostgreSQL storage

### Database Design
- **PostgreSQL**: Primary database using Neon/Supabase hosting
- **Schema Structure**:
  - `users`: User authentication and management
  - `profiles`: Instagram profile data with follower counts, categories, and confidence scores
  - `scraping_sessions`: Batch processing sessions for organizing profile imports
- **Advanced Features**: Bio embeddings for semantic search, follower parsing algorithms, confidence scoring

### Data Processing Pipeline
- **Follower Extraction**: Sophisticated parsing algorithms for various follower count formats (K/M/B notation)
- **Profile Parsing**: URL extraction, username normalization, brand name formatting
- **Confidence Scoring**: Automatic quality assessment of profile data
- **Batch Processing**: Session-based organization for large dataset imports

### API Structure
- **RESTful Endpoints**: CRUD operations for profiles, sessions, and users
- **Search Functionality**: Text-based and semantic search capabilities
- **Filtering System**: Category, city, follower count, and confidence level filters
- **Bulk Operations**: Batch profile creation and session management

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Alternative**: Supabase PostgreSQL with built-in auth and real-time features

### Development Tools
- **Replit Integration**: Development environment with hot reloading and error handling
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast bundling for production deployments

### UI Libraries
- **Radix UI**: Comprehensive component primitives for accessible UI
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe utility for component variants

### Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Nanoid**: Unique ID generation for database records
- **CLSX/Tailwind Merge**: CSS class management utilities

### Authentication & Security
- **Connect-pg-simple**: PostgreSQL session store for Express
- **Bcrypt**: Password hashing (implied from user schema)
- **CORS Handling**: Cross-origin request management for API security