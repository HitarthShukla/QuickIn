# QuickIn

A real-time social networking platform for spontaneous meetups and activities, connecting people who want to do things *right now*.

## 🚀 Tech Stack

### Client (Frontend)
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for blazing-fast development
- **Pinia** for state management
- **Vue Router** for navigation
- **TailwindCSS** for styling
- **Socket.IO Client** for real-time features
- **Axios** for API requests

### Server (Backend)
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Helmet** for security headers
- **Nodemailer** for email services

## 📁 Project Structure

```
QuickIn/
├── client/          # Vue 3 frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── router/       # Vue Router configuration
│   │   ├── stores/       # Pinia state stores
│   │   └── assets/       # Static assets
│   └── ...
│
├── server/          # Express backend API
│   ├── src/
│   │   ├── config/       # Database & app configuration
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── socket/       # Socket.IO event handlers
│   │   └── utils/        # Utility functions
│   └── ...
│
└── README.md
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/QuickIn.git
   cd QuickIn
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure server environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secret, and other config
   ```

4. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

**Start the backend server:**
```bash
cd server
npm run dev
```
Server runs at `http://localhost:5000`

**Start the frontend client:**
```bash
cd client
npm run dev
```
Client runs at `http://localhost:5173`

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/forgot-password` | POST | Password reset request |

## 🔐 Environment Variables

### Server (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quickin
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

## 📜 Scripts

### Server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.