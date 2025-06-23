# AIOT Express Application

A Node.js Express application built with TypeScript following modern best practices.

## 📁 Project Structure

```
app/
├── src/                    # Source code
│   ├── app.ts             # Express app configuration
│   ├── server.ts          # Server entry point
│   ├── routes/            # Route handlers
│   │   ├── index.ts       # Home routes
│   │   └── users.ts       # User API routes
│   ├── controllers/       # Business logic
│   │   └── userController.ts
│   ├── middleware/        # Custom middleware
│   │   └── errorHandler.ts
│   └── types/             # TypeScript type definitions
│       └── index.ts
├── public/                # Static assets
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   └── images/           # Images
├── views/                 # Template files (Jade/Pug)
├── dist/                  # Compiled TypeScript output
└── Dockerfile.be          # Docker configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Development mode (with hot reload):
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Run production build:
```bash
npm run serve
```

## 📝 Available Scripts

- `npm start` - Start with tsx (development)
- `npm run dev` - Development mode with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode compilation
- `npm run serve` - Run compiled JavaScript

## 🛠 API Endpoints

- `GET /` - Home page
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

## 🔧 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Jade/Pug** - Template engine
- **tsx** - TypeScript execution
- **nodemon** - Development auto-reload

## 🏗 Development

The project uses:
- ES Modules (`"type": "module"` in package.json)
- Strict TypeScript configuration
- Organized folder structure following Node.js best practices
- Error handling middleware
- Type-safe API responses

## 🐳 Docker

Build and run with Docker:
```bash
docker build -f Dockerfile.be -t aiot-app .
docker run -p 8000:8000 aiot-app
``` 


完成以下功能
這是IOT 的 backend system
總共有command device devicedata, event, rbac 這些 data source

