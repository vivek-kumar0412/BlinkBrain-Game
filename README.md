# BlinkBrain - Simon Game with User Accounts

A colorful Simon Game with user registration, login, and per-user high score tracking using Node.js, Express, MongoDB, and session-based authentication.

## Features

✨ User registration and login  
🎮 Classic Simon Game with rotating animated title  
📊 Per-user high score tracking  
🎨 Beautiful gradient UI with animations  
🔐 Secure password hashing with bcrypt  
💾 Persistent user data in MongoDB  

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas recommended)
- **Authentication:** express-session + bcrypt
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)

## Prerequisites

- Node.js (v14+) and npm
- MongoDB Atlas account (free tier available at https://mongodb.com/cloud/atlas)
- Git (optional)

## Setup Instructions

### 1. Install Dependencies

```powershell
cd "C:\Users\Lenovo\Desktop\Simon Game"
npm install
```

### 2. Configure MongoDB

1. Go to https://mongodb.com/cloud/atlas and create a free account.
2. Create a cluster (free tier available).
3. Add a database user with a password.
4. Get your connection string: Cluster → Connect → Drivers → Node.js.
5. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/simongame?retryWrites=true&w=majority`).

### 3. Set Up Environment Variables

Edit `.env` in the project root:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/simongame?retryWrites=true&w=majority
SESSION_SECRET=your_super_secret_key_change_this_in_production_12345
PORT=3000
NODE_ENV=development
```

Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER` with your MongoDB Atlas credentials.

### 4. Start the Server

```powershell
npm start
```

You should see:
```
✅ MongoDB connected
🎮 Simon Game server running on http://localhost:3000
```

### 5. Open in Browser

Open http://localhost:3000/login.html in your browser.

## Usage

1. **Register:** Click "Register here" and create a new account.
2. **Login:** Enter your email and password.
3. **Play:** Press any key to start the game.
4. **High Score:** Your high score is saved automatically and persists across sessions.
5. **Logout:** Click the "Logout" button in the top-right corner.

## Project Structure

```
Simon Game/
├── server.js                  # Express server and routes
├── app.js                     # Game logic (client-side)
├── index.html                 # Game page
├── login.html                 # Auth page (login/register)
├── styles.css                 # Game styling
├── models/
│   └── User.js               # MongoDB User schema
├── package.json              # Dependencies
├── .env                       # Environment variables (DO NOT COMMIT)
└── .gitignore               # Git ignore file
```

## API Routes

### Public Routes
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/health` - Health check

### Protected Routes (require authentication)
- `GET /api/me` - Get current user info
- `POST /api/logout` - Logout user
- `POST /api/highscore` - Save/update user high score

## Development

To use auto-reload during development (requires nodemon):

```powershell
npm run dev
```

## Troubleshooting

**"Cannot find module 'express'"**
- Run `npm install` again

**"MongoDB connection failed"**
- Check `.env` file has correct MongoDB URI
- Ensure MongoDB Atlas IP whitelist includes your IP (or use 0.0.0.0)
- Check username/password are correct

**"Cannot GET /login.html"**
- Make sure server is running (`npm start`)
- Check URL is `http://localhost:3000/login.html`

**Port 3000 already in use**
- Change `PORT` in `.env` to a different number (e.g., 3001)
- Or kill the process using port 3000

## Notes

- Passwords are hashed using bcrypt (10 salt rounds) — never stored in plain text.
- Sessions expire after 7 days of inactivity.
- All routes are case-insensitive for email addresses (emails are lowercased).
- High scores are only updated if the new score is higher than the existing one.

## Future Enhancements

- Leaderboard (global high scores)
- Difficulty levels
- Sound effects
- Multiplayer/competitive mode
- Mobile app

## License

ISC

---

**Questions?** Check `server.js` and `app.js` for inline comments.
