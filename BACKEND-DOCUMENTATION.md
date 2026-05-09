# Backend Documentation - Real Estate CRM

## Overview

The backend is a **Node.js/Express** REST API deployed as **Firebase Cloud Functions**. It uses **MongoDB (Mongoose)** for data persistence and provides endpoints for managing real estate CRM operations including leads, properties, builders, investors, and user management.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js (v22) | Runtime |
| Express 5 | Web framework |
| MongoDB / Mongoose | Database & ODM |
| Firebase Functions | Cloud deployment |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Joi | Request validation |
| Nodemailer | Email service |
| node-cron | Scheduled tasks |
| ExcelJS | Lead import/export |
| Multer | File uploads |

---

## Project Structure

```
backend/functions/
├── config/
│   └── db.js                  # MongoDB connection configuration
├── controllers/
│   ├── authController.js      # Login/register logic
│   ├── userController.js      # User CRUD operations
│   ├── leadController.js      # Lead management
│   ├── leadImportExportController.js  # Excel import/export for leads
│   ├── builderController.js   # Builder management
│   ├── investorController.js  # Investor management
│   ├── landmarkController.js  # Landmark management
│   ├── propertyTypeController.js      # Property type CRUD
│   └── propertyConditionController.js # Property condition CRUD
├── middleware/
│   ├── auth.js                # JWT authentication middleware
│   ├── errorHandler.js        # Global error handling
│   └── upload.js              # File upload (Multer) config
├── models/
│   ├── Admin.js               # Admin/User schema
│   ├── Lead.js                # Lead schema
│   ├── Builder.js             # Builder schema
│   ├── Investor.js            # Investor schema
│   ├── Landmark.js            # Landmark schema
│   ├── PropertyType.js        # Property type schema
│   └── PropertyCondition.js   # Property condition schema
├── routes/
│   ├── authRoutes.js          # POST /api/auth/login
│   ├── userRoutes.js          # /api/users
│   ├── leadRoutes.js          # /api/leads
│   ├── builderRoutes.js       # /api/builders
│   ├── investorRoutes.js      # /api/investors
│   ├── landmarkRoutes.js      # /api/landmarks
│   ├── propertyTypeRoutes.js  # /api/property-types
│   └── propertyConditionRoutes.js # /api/property-conditions
├── utils/
│   ├── cronJobs.js            # Scheduled cron tasks
│   ├── emailService.js        # Email sending utility
│   ├── generateToken.js       # JWT token generation
│   └── validation.js          # Joi validation schemas
├── scripts/                   # Utility/deployment scripts
├── index.js                   # Firebase Functions entry point
├── server.js                  # Express app setup & local server
├── firebase.json              # Firebase configuration
├── package.json               # Dependencies & scripts
└── .env                       # Environment variables (not committed)
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | User login |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Leads
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leads` | Get all leads (with filters) |
| POST | `/api/leads` | Create lead |
| PUT | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead |
| POST | `/api/leads/import` | Import leads from Excel |
| GET | `/api/leads/export` | Export leads to Excel |

### Builders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/builders` | Get all builders |
| POST | `/api/builders` | Create builder |
| PUT | `/api/builders/:id` | Update builder |
| DELETE | `/api/builders/:id` | Delete builder |

### Investors
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/investors` | Get all investors |
| POST | `/api/investors` | Create investor |
| PUT | `/api/investors/:id` | Update investor |
| DELETE | `/api/investors/:id` | Delete investor |

### Landmarks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/landmarks` | Get all landmarks |
| POST | `/api/landmarks` | Create landmark |
| PUT | `/api/landmarks/:id` | Update landmark |
| DELETE | `/api/landmarks/:id` | Delete landmark |

### Property Types
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/property-types` | Get all property types |
| POST | `/api/property-types` | Create property type |
| PUT | `/api/property-types/:id` | Update property type |
| DELETE | `/api/property-types/:id` | Delete property type |

### Property Conditions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/property-conditions` | Get all property conditions |
| POST | `/api/property-conditions` | Create property condition |
| PUT | `/api/property-conditions/:id` | Update property condition |
| DELETE | `/api/property-conditions/:id` | Delete property condition |

---

## Data Models

### Lead
- Name, phone, email
- Property type, condition, landmark references
- Budget range, area details
- Status tracking (New, Contacted, Follow-up, Converted, Lost)
- Assigned user, notes, source

### Builder
- Name, contact info, projects list

### Investor
- Name, contact info, investment preferences

### Landmark
- Name, location details

### PropertyType / PropertyCondition
- Name, description, active status

### Admin (User)
- Name, email, password (hashed), role

---

## Environment Variables

Create a `.env` file in `backend/functions/`:

```env
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
NODE_ENV=development
PORT=5000
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run serve` | Start Firebase emulators locally |
| `npm run deploy` | Deploy to Firebase Functions |
| `npm run logs` | View Firebase function logs |
| `node server.js` | Run Express server locally (port 5000) |

---

## CORS Configuration

Allowed origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://crm-realestate-737a2.web.app`

---

## Deployment

The backend is deployed as a Firebase Cloud Function. The `index.js` exports the Express app as an HTTP function. Use `npm run deploy` to deploy.
