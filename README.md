# PoetryHub - Full-Stack Poetry Sharing Platform

A beautiful, production-ready poetry sharing platform built with React, TypeScript, Node.js, Express, and MongoDB.

## Features

### 🔐 Authentication & User Management
- Secure user registration and login with JWT tokens
- User profiles with customizable bio and avatar
- Password hashing with bcrypt

### 📝 Poetry Management
- Rich text editor for creating and formatting poems
- Categories and tags for better organization
- Optional image upload for poems
- Featured poems section for highlights
- Search and filter functionality

### 💬 Social Features
- Like and unlike poems with real-time updates
- Nested comment system with replies
- Social sharing buttons
- User following system (ready for implementation)

### 🎨 Modern Design
- Responsive design that works on all devices
- Beautiful typography optimized for poetry reading
- Smooth animations and hover effects
- Clean, professional UI with gradient accents

### 📊 Analytics & Insights
- User statistics (poems, likes, comments)
- Trending poems based on engagement
- Recent activity feeds

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens with bcrypt
- **File Upload**: Multer for image handling
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Animations**: CSS Transitions & Transforms

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)
- MongoDB Compass (optional, for database management)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd poetry-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up MongoDB:
   - Install MongoDB locally or create a MongoDB Atlas account
   - Create a database named `poetry-platform`
   - Note your MongoDB connection string

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/poetry-platform
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
```

5. Create uploads directory:
```bash
mkdir server/uploads
```

6. Start the development servers:
```bash
npm run dev
```

This will start both the frontend (Vite) and backend (Express) servers concurrently.

## Database Schema

The platform uses MongoDB with the following collections:

### Users Collection
- **_id**: ObjectId (primary key)
- **username**: String (unique)
- **email**: String (unique)
- **password**: String (hashed)
- **bio**: String (optional)
- **avatar_url**: String (optional)
- **followers**: Array of ObjectIds
- **following**: Array of ObjectIds
- **createdAt/updatedAt**: Timestamps

### Poems Collection
- **_id**: ObjectId (primary key)
- **title**: String
- **content**: String
- **author**: ObjectId (references Users)
- **category**: String
- **tags**: Array of Strings
- **image_url**: String (optional)
- **likes**: Array of ObjectIds (references Users)
- **likes_count**: Number
- **comments_count**: Number
- **is_featured**: Boolean
- **createdAt/updatedAt**: Timestamps

### Comments Collection
- **_id**: ObjectId (primary key)
- **poem**: ObjectId (references Poems)
- **author**: ObjectId (references Users)
- **content**: String
- **parent**: ObjectId (references Comments, for replies)
- **replies**: Array of ObjectIds (references Comments)
- **createdAt/updatedAt**: Timestamps

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Poems
- `GET /api/poems` - Get all poems (with filtering and sorting)
- `GET /api/poems/featured` - Get featured poems
- `GET /api/poems/trending` - Get trending poems
- `GET /api/poems/:id` - Get specific poem
- `POST /api/poems` - Create new poem (with image upload)
- `PUT /api/poems/:id` - Update poem
- `DELETE /api/poems/:id` - Delete poem

### Likes
- `POST /api/poems/:id/like` - Toggle like on poem
- `GET /api/poems/:id/like-status` - Check if user liked poem

### Comments
- `GET /api/poems/:id/comments` - Get poem comments
- `POST /api/poems/:id/comments` - Add comment or reply

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/poems` - Get user's poems
- `GET /api/users/:id/stats` - Get user statistics
- `POST /api/users/:id/follow` - Toggle follow user

## Key Components

### Core Pages
- `Home`: Featured, trending, and recent poems
- `Explore`: Search and filter all poems
- `CreatePoem`: Rich editor for writing poetry with image upload
- `PoemDetail`: Full poem view with comments and replies
- `Profile`: User profiles and poem collections
- `Login/Register`: Authentication flows

### Shared Components
- `Navbar`: Navigation with responsive design
- `PoemCard`: Reusable poem display component
- `AuthContext`: Global authentication state

## Features in Detail

### Poetry Editor
- Auto-resizing textarea for comfortable writing
- Category selection and tag management
- Image upload with preview
- Real-time character count
- Form validation and error handling

### Social Interactions
- One-click like/unlike with optimistic updates
- Threaded comment system with replies
- Social sharing with Web Share API fallback
- User statistics and engagement metrics

### Search & Discovery
- Full-text search across titles, content, and tags
- Category-based filtering
- Multiple sorting options (recent, popular, alphabetical)
- Tag-based discovery

### File Upload
- Image upload for poems
- File size and type validation
- Automatic file naming and storage
- Image preview in editor

## Development

### Running in Development
```bash
npm run dev          # Start both frontend and backend
npm run dev:client   # Start only frontend (Vite)
npm run dev:server   # Start only backend (Express)
```

### Building for Production
```bash
npm run build        # Build frontend for production
```

### Database Management
Use MongoDB Compass to:
- View and manage your data
- Create indexes for better performance
- Monitor database performance
- Import/export data

## Deployment

The application can be deployed on platforms like:
- **Frontend**: Netlify, Vercel, AWS Amplify
- **Backend**: Heroku, Railway, DigitalOcean
- **Database**: MongoDB Atlas

### Environment Variables for Production
```
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
PORT=5000
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Protected routes and middleware

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.