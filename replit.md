# GrowthMate AI - Business Analytics Chatbot

## Overview

GrowthMate AI is a full-stack chatbot application designed for entrepreneurs to perform business analytics through natural language queries. The application combines a Node.js/Express backend with a React/Vite frontend to provide real-time data analysis and visualization capabilities. Users can ask questions in plain English about their business data, and the system translates these queries into structured data operations, generates visualizations, and provides actionable insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite for fast development and hot module replacement
- **TypeScript**: Type-safe development with comprehensive type definitions
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Charts**: Recharts library for data visualization components

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: JWT-based authentication with access and refresh tokens
- **Password Security**: bcryptjs for secure password hashing
- **AI Integration**: OpenAI GPT-4o for natural language processing and query analysis
- **Data Processing**: Custom services for query processing, data source management, and visualization generation

### Database Design
- **PostgreSQL**: Primary database with Neon serverless connection
- **Schema**: Comprehensive table structure including users, conversations, messages, data sources, queries, visualizations, and templates
- **Relationships**: Proper foreign key relationships with cascade delete for data integrity
- **Migration**: Drizzle Kit for database schema management and migrations

### Authentication & Security
- **JWT Tokens**: Dual-token system with short-lived access tokens (15 minutes) and longer refresh tokens (7 days)
- **Password Hashing**: bcryptjs with salt rounds for secure password storage
- **Middleware**: Authentication middleware for protected routes
- **Session Management**: Secure token storage and automatic refresh mechanisms

### Data Source Integration
- **Google Sheets**: API integration for spreadsheet data access
- **Multiple Sources**: Extensible architecture supporting PostgreSQL, CSV, and generic API connections
- **Configuration**: JSON-based configuration storage for flexible data source management
- **Validation**: Connection testing and data validation before processing

### Natural Language Processing
- **OpenAI Integration**: GPT-4o model for analyzing user queries and generating insights
- **Query Analysis**: Structured extraction of intent, entities, query type, and visualization suggestions
- **Business Context**: Specialized prompts optimized for entrepreneurial and business analytics use cases
- **Response Generation**: AI-generated summaries, key insights, and recommendations

### Real-time Features
- **Chat Interface**: Interactive conversation system with message history
- **Processing Feedback**: Real-time status updates during query processing
- **Auto-scroll**: Automatic message scrolling for better user experience

## External Dependencies

### Frontend Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI components for building the interface
- **@tanstack/react-query**: Server state management and caching solution
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries
- **recharts**: Chart library for data visualization components
- **tailwindcss**: Utility-first CSS framework for styling
- **wouter**: Lightweight routing solution for single-page application navigation
- **zod**: TypeScript-first schema validation library

### Backend Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database driver
- **drizzle-orm**: Type-safe ORM for database operations
- **bcryptjs**: Password hashing library for security
- **jsonwebtoken**: JWT token generation and verification
- **openai**: Official OpenAI SDK for AI integration
- **googleapis**: Google APIs client library for Sheets integration

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database schema management and migration tool
- **esbuild**: Fast JavaScript bundler for production builds

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **OpenAI API**: GPT-4o model access for natural language processing
- **Google Sheets API**: Integration for spreadsheet data sources

### Optional Integrations
- **Socket.io**: WebSocket support for real-time features (architecture prepared)
- **Chart Export**: Server-side rendering capabilities for chart export functionality
- **Email Services**: User notification and communication systems