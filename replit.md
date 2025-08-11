# Overview

PulseBusiness Suite Deployment Admin Panel is a modern web application designed to manage and deploy pre-built Pulse modules across connected nodes. The system serves as a centralized deployment orchestration dashboard that allows users to load existing modules, configure them, and deploy them to connected Raspberry Pi nodes, AI servers, and edge devices. This is a deployment management tool, not a development environment - it focuses on loading and distributing already-built modules like PulseAI, PulseLedger, PulseQuery, and other components of the PulseBusiness ecosystem.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, utilizing Vite as the build tool for fast development and hot reload capabilities. The application uses a modern component-based architecture with:

- **UI Framework**: React with TypeScript for type safety and component reusability
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design patterns
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast bundling and development experience

The frontend follows a modular structure with separate pages for dashboard overview, module management, node management, deployments, monitoring, and logs. Components are organized into reusable UI components and feature-specific components.

## Backend Architecture
The backend is implemented using Express.js with TypeScript, providing a RESTful API architecture:

- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful endpoints for CRUD operations on nodes, modules, and deployments
- **Development**: TSX for TypeScript execution in development
- **Production**: Compiled to JavaScript using esbuild for optimal performance

The server implements middleware for request logging, JSON parsing, and error handling. Routes are organized into separate modules for system status, node management, module operations, and deployment management.

## Data Storage Solutions
The application uses a flexible storage architecture that can scale from development to production:

- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Database**: PostgreSQL as the primary database (configured for Neon serverless)
- **Schema**: Well-defined schemas for nodes, modules, and deployments with proper relationships
- **Development**: In-memory storage implementation for rapid prototyping and testing
- **Production**: Full PostgreSQL integration with connection pooling and migrations

The data model includes three main entities: nodes (deployment targets), modules (deployable components), and deployments (active module instances on nodes).

## Authentication and Authorization
Currently, the system operates without explicit authentication mechanisms, designed for internal administrative use within secure network environments. Future implementations may include:

- Session-based authentication for admin users
- Role-based access control for different operational levels
- API key authentication for automated deployment tools

## Deployment and Module Management
The core architectural pattern revolves around a three-tier deployment model:

- **Module Discovery**: System scans configured paths to discover available Pulse modules
- **Node Registration**: Connected devices register themselves with the deployment system
- **Deployment Orchestration**: Automated deployment of modules to selected nodes with configuration management

The system supports various node types including Raspberry Pi devices, AI servers, and edge computing devices, each with different capabilities and resource profiles.

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity for cloud deployments
- **drizzle-orm**: TypeScript ORM for database operations and schema management
- **express**: Web application framework for the backend API server
- **react**: Frontend UI library for component-based user interfaces
- **@tanstack/react-query**: Server state management and data fetching library

## UI and Styling Dependencies
- **tailwindcss**: Utility-first CSS framework for styling
- **@radix-ui/***: Comprehensive set of accessible UI components (accordion, dialog, dropdown, etc.)
- **lucide-react**: Icon library providing consistent iconography
- **class-variance-authority**: Utility for creating variant-based component APIs
- **cmdk**: Command palette component for enhanced user interaction

## Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking for improved code quality
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution engine for development

## Database and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-kit**: Database migration and introspection tools
- **zod**: Schema validation library for runtime type checking

## Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **wouter**: Lightweight router for single-page applications
- **nanoid**: Secure URL-friendly unique ID generator

## Form and Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for form integration
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

The architecture emphasizes modularity, type safety, and scalability while maintaining simplicity for rapid deployment and management of the PulseBusiness module ecosystem.