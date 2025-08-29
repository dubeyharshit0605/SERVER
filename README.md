# Mangrove Tracker API

A Node.js + Express backend API for a community mangrove tracking application.

## Features

- User registration and login with nickname + community ID
- Tree planting and maintenance tracking
- Verification system for community leaders
- Reward points system
- Offline data synchronization
- MongoDB database with Mongoose ODM
- JWT authentication

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Trees

- `POST /api/trees` - Create a new tree record (protected)
- `GET /api/trees` - Get all trees for a community (protected)
- `GET /api/trees/:id` - Get a single tree by ID (protected)
- `PUT /api/trees/:id` - Update a tree record (protected)
- `DELETE /api/trees/:id` - Delete a tree record (protected)
- `POST /api/trees/:id/maintenance` - Add maintenance record to a tree (protected)
- `PUT /api/trees/:id/verify` - Verify a tree record (leaders only)

### Rewards

- `GET /api/rewards` - Get rewards for the current user (protected)
- `GET /api/rewards/community` - Get rewards for a community (leaders only)
- `POST /api/rewards` - Award points to a user (leaders only)
- `GET /api/rewards/leaderboard` - Get leaderboard for a community (protected)

### Sync

- `POST /api/sync/trees` - Sync offline tree data (protected)
- `POST /api/sync/maintenance` - Sync offline maintenance records (protected)
- `GET /api/sync/data` - Get all data for offline use (protected)

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mangrove_tracker
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```
4. Start the server:
   - Development: `npm run dev`
   - Production: `npm start`

## Data Models

### User

- `nickname` - Unique identifier for the user
- `communityId` - Community identifier
- `password` - Hashed password
- `role` - User role (member or leader)
- `rewardPoints` - Accumulated reward points

### Tree

- `userId` - Reference to the user who planted the tree
- `communityId` - Community identifier
- `location` - Geospatial coordinates
- `species` - Tree species
- `plantedDate` - Date when the tree was planted
- `healthStatus` - Current health status
- `maintenanceRecords` - Array of maintenance activities
- `verificationStatus` - Verification status
- `verifiedBy` - Reference to the leader who verified
- `images` - Array of image URLs
- `notes` - Additional notes

### Reward

- `userId` - Reference to the user who earned the reward
- `communityId` - Community identifier
- `points` - Number of points awarded
- `reason` - Reason for the reward
- `relatedTreeId` - Reference to the related tree (if applicable)
- `awardedBy` - Reference to the leader who awarded the points

## License

MIT

