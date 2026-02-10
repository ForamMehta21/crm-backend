# Real Estate CRM Backend

A comprehensive RESTful API for Real Estate CRM built with Node.js, Express, and MongoDB.

## Features

- JWT Authentication
- Role-Based Access Control (Admin only)
- CRUD operations for Property Types, Property Conditions, Landmarks, and Leads
- Advanced filtering and search for leads
- Input validation with Joi
- Error handling middleware
- MongoDB with Mongoose ODM

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and JWT secret

4. Seed admin user:
```bash
node scripts/seedAdmin.js
```

5. Start server:
```bash
# Development
npm run dev

# Production
npm start
```

## Default Admin Credentials

- Email: `admin@realestate.com`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get admin profile (Protected)

### Property Types
- `GET /api/property-types` - Get all property types
- `POST /api/property-types` - Create property type
- `GET /api/property-types/:id` - Get property type by ID
- `PUT /api/property-types/:id` - Update property type
- `DELETE /api/property-types/:id` - Delete property type

### Property Conditions
- `GET /api/property-conditions` - Get all property conditions
- `POST /api/property-conditions` - Create property condition
- `GET /api/property-conditions/:id` - Get property condition by ID
- `PUT /api/property-conditions/:id` - Update property condition
- `DELETE /api/property-conditions/:id` - Delete property condition

### Landmarks
- `GET /api/landmarks` - Get all landmarks (supports city & area filters)
- `POST /api/landmarks` - Create landmark
- `GET /api/landmarks/:id` - Get landmark by ID
- `PUT /api/landmarks/:id` - Update landmark
- `DELETE /api/landmarks/:id` - Delete landmark

### Leads
- `GET /api/leads` - Get all leads (supports filters & pagination)
- `POST /api/leads` - Create lead
- `GET /api/leads/stats` - Get lead statistics
- `GET /api/leads/:id` - Get lead by ID
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

## Query Parameters for Leads

- `leadType` - Filter by Buyer/Broker/Seller
- `city` - Filter by city
- `minBudget` - Minimum budget
- `maxBudget` - Maximum budget
- `leadStatus` - Filter by status
- `search` - Search in name, phone, email
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Bcrypt.js
- Joi (Validation)
