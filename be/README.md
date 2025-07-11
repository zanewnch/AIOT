# AIOT Backend - IoT Management System

A comprehensive Node.js Express backend for IoT device management, real-time communication, and user authentication with RBAC (Role-Based Access Control).

## 📁 Project Structure

```
be/
├── src/                    # Source code
│   ├── server.ts          # Server entry point & main application
│   ├── config/            # Configuration files
│   │   └── swaggerConfig.ts
│   ├── controller/        # REST API controllers
│   │   ├── InitController.ts       # Data initialization
│   │   ├── JWTAuthController.ts    # Authentication
│   │   ├── SwaggerController.ts    # API documentation
│   │   └── rbac/                   # RBAC controllers
│   │       ├── UserController.ts
│   │       ├── RoleController.ts
│   │       ├── PermissionController.ts
│   │       └── ...
│   ├── models/            # Database models (Sequelize)
│   │   ├── RTKDataModel.ts         # GPS positioning data
│   │   └── rbac/                   # RBAC models
│   │       ├── UserModel.ts
│   │       ├── RoleModel.ts
│   │       └── ...
│   ├── service/           # Business logic services
│   │   ├── AuthService.ts          # Authentication service
│   │   ├── RabbitMQService.ts      # Message queue service
│   │   ├── DeviceDataService.ts    # IoT device data
│   │   └── ...
│   ├── infrastructure/    # Database configurations
│   │   ├── MysqlDBConfig.ts        # MySQL setup
│   │   └── MongoDBConfig.ts        # MongoDB setup
│   ├── middleware/        # Express middleware
│   │   ├── jwtAuthMiddleware.ts    # JWT authentication
│   │   └── errorHandleMiddleware.ts
│   ├── repo/              # Repository pattern for data access
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility classes & functions
│   └── examples/          # Usage examples
├── docs/                  # Generated documentation
└── Dockerfile.be          # Docker configuration
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MySQL** (localhost:3306)
- **MongoDB** (localhost:27017) 
- **RabbitMQ** (localhost:5672)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env file with your database credentials
```

3. Start development server:
```bash
npm run dev
# Server runs on http://localhost:8010
```

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=main_db
DB_USER=admin
DB_PASSWORD=admin
DB_PORT=3306

# Authentication
JWT_SECRET=your-secret-key

# Message Queue
RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

## 📝 Available Scripts

- `npm run dev` - Development mode with nodemon (port 8010)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run serve` - Run compiled JavaScript
- `npm run test` - Run Jest tests
- `npm run docs:generate` - Generate TypeDoc documentation
- `npm run docs:serve` - Serve documentation (port 8001)
- `npm run docs:clean` - Clean documentation files

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `POST /api/auth/logout` - User logout

### Initialization
- `POST /api/init/rbac-demo` - Initialize RBAC demo data
- `POST /api/init/rtk-demo` - Initialize RTK positioning demo data

### RBAC Management (JWT Required)
- `GET/POST /api/rbac/users` - User management
- `GET/PUT/DELETE /api/rbac/users/:userId` - Individual user operations
- `GET/POST /api/rbac/roles` - Role management
- `GET/PUT/DELETE /api/rbac/roles/:roleId` - Individual role operations
- `GET/POST /api/rbac/permissions` - Permission management
- `GET/PUT/DELETE /api/rbac/permissions/:permissionId` - Individual permission operations

### Documentation
- `GET /api/swagger.json` - OpenAPI specification
- `GET /api/docs` - Swagger UI interface

## 🔧 Technologies Used

### Core Framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe programming

### Database & ORM
- **MySQL** - Primary database (with Sequelize-TypeScript)
- **MongoDB** - Secondary database (with Mongoose)
- **Sequelize** - MySQL ORM with TypeScript decorators

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens for stateless authentication
- **bcrypt** - Password hashing

### Message Queue & IoT
- **RabbitMQ** - Message broker for device communication
- **amqplib** - RabbitMQ client library

### Documentation & Development
- **Swagger/OpenAPI 3.0** - API documentation
- **TypeDoc** - Code documentation generation
- **Jest** - Testing framework
- **nodemon** - Development auto-reload

## 🏗 Architecture Features

### Design Patterns
- **Repository Pattern** - Data access abstraction
- **Service Layer Pattern** - Business logic separation
- **Dependency Injection** - Using RBACContainer for service management
- **Interface-based Design** - Testable and maintainable code

### Security
- **Role-Based Access Control (RBAC)** - Fine-grained permissions
- **JWT Authentication** - Stateless authentication
- **Password Hashing** - bcrypt for secure password storage
- **Environment-based Configuration** - Secure credential management

### IoT Features
- **Real-time Device Communication** - RabbitMQ message broker
- **RTK GPS Positioning** - Real-time kinematic positioning data
- **Device Event Handling** - Comprehensive IoT event management

## 📚 Documentation

### API Documentation (Swagger/OpenAPI)
The project uses **YAML-driven Swagger documentation** separate from code documentation:

#### Access Points
- **Swagger UI**: `http://localhost:8010/api/docs`
- **OpenAPI JSON**: `http://localhost:8010/api/swagger.json`
- **Frontend Integration**: React components can consume the JSON specification

#### Documentation Structure
- **Main spec file**: `/docs/swagger.yaml` - Complete OpenAPI 3.0 specification
- **Configuration**: `/src/config/swaggerConfig.ts` - YAML parser and setup
- **Controller**: `/src/controller/SwaggerController.ts` - API endpoints for documentation

#### Maintaining API Documentation
1. **Update API docs**: Edit `/docs/swagger.yaml` directly
2. **Add new endpoints**: Define in YAML format following OpenAPI 3.0 spec
3. **Changes take effect**: After server restart

#### Example YAML Structure
```yaml
/api/auth/login:
  post:
    tags: [Authentication]
    summary: User login
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username: { type: string }
              password: { type: string }
    responses:
      '200':
        description: Login successful
        content:
          application/json:
            schema:
              type: object
              properties:
                token: { type: string }
```

### Code Documentation (TypeDoc)
Internal code documentation generated from TypeScript comments:

- **Generate**: `npm run docs:generate`
- **Serve**: `npm run docs:serve` (available at `http://localhost:8001`)
- **Source**: TypeScript comments and interfaces in source code
- **Output**: `./docs/` directory (auto-generated, do not edit manually)

### Documentation Types
| Type | Purpose | Source | Access |
|------|---------|---------|--------|
| **Swagger** | External API docs, testing | `/docs/swagger.yaml` | `/api/docs` |
| **TypeDoc** | Internal code reference | TypeScript comments | `npm run docs:serve` |

## 🐳 Docker

Build and run with Docker:
```bash
docker build -f Dockerfile.be -t aiot-backend .
docker run -p 8010:8010 aiot-backend
```

## 🚀 Deployment

### Environment Setup
1. Ensure all prerequisite services are running:
   - MySQL database (port 3306)
   - MongoDB database (port 27017)
   - RabbitMQ message broker (port 5672)

2. Configure environment variables in production
3. Run database migrations/initialization if needed
4. Build and deploy the application

### Health Checks
The server includes connection monitoring for:
- MySQL database connectivity
- MongoDB connectivity  
- RabbitMQ connection status
- JWT authentication functionality

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- UserController.test.ts
```

## 📋 Database Schema

### MySQL Tables
- **users**: User accounts with authentication
- **roles**: User roles for RBAC
- **permissions**: System permissions
- **user_roles**: Many-to-many user-role relationships
- **role_permissions**: Many-to-many role-permission relationships
- **rtk_data**: RTK GPS positioning data (latitude/longitude coordinates)

### MongoDB Collections
- Configured for additional data storage (flexible schema)
- Connection available but collections defined as needed


