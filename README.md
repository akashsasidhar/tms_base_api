# Task Management System - Backend

Secure RBAC-based admin platform backend built with Node.js, Express.js, TypeScript, Sequelize, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Authentication**: JWT with JWE (Access + Refresh tokens)
- **Authorization**: RBAC (Role-Based Access Control)
- **Ecmascript**: ES6+

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14.0

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory with the following required variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management_db
DB_USER=postgres
DB_PASSWORD=your-database-password

# JWT Secrets
JWT_SECRET=your-secret-key-change-in-production
JWE_SECRET_KEY=your-jwe-secret-key-32-bytes-minimum-change-in-production

# Email Configuration (Required for password reset functionality)
SYSTEM_EMAIL=your-email@gmail.com
SYSTEM_EMAIL_PASSWORD=your-gmail-app-password

# Frontend URL
FRONT_END_PORTAL=http://localhost:3000
```

**Note**: For Gmail, you need to generate an App Password:
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password for "Mail"
4. Use that App Password in `SYSTEM_EMAIL_PASSWORD`

## Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:undo` - Undo last migration
- `npm run seed` - Run database seeders
- `npm run seed:undo` - Undo all seeders
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

## Project Structure

```
backend/
├── src/
│   ├── modules/          # Feature modules (auth, users, roles)
│   ├── models/           # Sequelize models
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   ├── helpers/          # Helper functions
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Express app setup
├── migrations/            # Database migrations
├── seeders/              # Database seeders
├── tests/                # Test files
├── server.ts             # Server entry point
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Database Schema Requirements

All database tables MUST include these columns:
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `created_by` INTEGER
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_by` INTEGER
- `deleted_at` TIMESTAMPTZ
- `deleted_by` INTEGER

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- JWT with JWE encryption
- Bcrypt password hashing
- Input validation with Zod

## License

ISC
