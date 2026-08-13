# ⚡ Flick — Connect. Share. Vibe.

> A social media platform that brings Instagram, WhatsApp, and Telegram together in one place.

🌐 **Live Demo:** https://flick-app-production-822e.up.railway.app

---

## About

I wanted to build something that felt like a real app — not just a project. Flick is a full-stack social media platform where you can post, chat, follow people, and share stories, all from one place.

The goal was to combine the best parts of three apps:
- Instagram for the visual social feed
- WhatsApp for real-time messaging
- Telegram for channels and groups

Works on every device — phone, tablet, laptop. The layout responds to the screen size automatically.

---

## Features

### 📸 Posts & Feed
- Share photos and videos with captions
- Like and save posts
- Double-tap to like (Instagram-style)
- Comment on posts
- Multi-image carousel posts
- Feeling picker — tag your mood on posts (40+ feelings)
- Tag people in posts
- Add location to posts
- Choose audience — Everyone, Friends, or Only Me
- Post options — delete your own posts, report others

### 🎬 Stories
- Upload photo or video stories
- Stories expire after 24 hours
- Progress bar auto-advance
- Pause story on hold
- Reply to stories directly
- React with emojis

### 🎥 Reels
- Vertical scroll, snap-to-reel
- Like, comment, share, save reels
- Follow creators from reels

### 🔍 Explore
- Grid layout with trending posts
- Search by username, caption, tag
- Filter by Photos, Videos, People, Places

### 💬 Messaging
- Real-time direct messages
- Send text, photos, videos, documents, audio files
- Send current location
- Voice message UI
- Message reactions (long press any message)
- Read receipts (double tick ✓✓)
- Typing indicator
- Online / offline status
- Voice call and video call UI
- Chat info — view profile, block, clear chat
- Search through conversations

### 📡 Channels & Groups
- Follow public channels
- Discover new channels
- Group chats

### 👤 Profile
- Edit profile — name, bio, photo
- Posts, Reels, Saved, Tagged tabs
- Followers and following lists with follow/unfollow
- View other users' profiles
- Share your profile link

### ⚙️ Settings
- Edit Profile
- Change Photo
- Change Password
- Linked Accounts (Google, Facebook)
- Privacy Settings — private account toggle
- Blocked Accounts
- Two-Factor Authentication UI
- Login Activity
- Push Notifications — per-category toggles
- Email Notifications
- Chat Settings — read receipts, typing indicator, wallpaper
- Media Auto-Download settings
- Dark / Light Mode
- Language selection (10 languages)
- Your Activity — stats overview
- Archive
- Help Center
- Report a Problem
- About Flick
- Deactivate Account
- Log Out

### 🎨 Design
- Dark and Light mode
- Smooth animations throughout
- Skeleton loaders while content loads
- Bottom navigation on mobile
- Sidebar navigation on desktop
- Fully responsive — all screen sizes

---

## Tech Stack

### Frontend
- **HTML5** — semantic structure
- **CSS3** — custom properties, flexbox, grid, animations
- **Vanilla JavaScript** — no frameworks, everything from scratch
- **Font Awesome** — icons
- **Google Fonts (Inter)** — typography
- **PWA** — installable on phone, works offline

### Backend
- **Python 3.12**
- **Flask** — web framework
- **Flask-JWT-Extended** — authentication with access + refresh tokens
- **Flask-SocketIO** — real-time messaging (WebSocket)
- **Flask-SQLAlchemy** — ORM
- **SQLite** — database
- **Flask-CORS** — cross-origin requests
- **Pillow** — image processing and resizing
- **Waitress** — production WSGI server

### Deployment
- **Railway** — backend hosting (always online)
- **GitHub** — version control

---

## Database Models

| Model | Description |
|-------|-------------|
| User | Account info, avatar, bio, online status |
| Post | Caption, location, audience, images |
| PostImage | Images linked to posts |
| Like | User-post like relationship |
| Comment | Comments on posts |
| SavedPost | User's saved posts |
| Story | 24-hour media stories |
| StoryView | Who viewed a story |
| Message | Chat messages with type support |
| Conversation | Chat thread between two users |
| Follow | Follower-following relationship |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/login | Login and get tokens |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/me | Update profile |
| POST | /api/auth/refresh | Refresh access token |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts/feed | Get following feed |
| GET | /api/posts/explore | Explore all posts |
| POST | /api/posts | Create a post |
| DELETE | /api/posts/:id | Delete a post |
| POST | /api/posts/:id/like | Like or unlike |
| POST | /api/posts/:id/save | Save or unsave |
| GET | /api/posts/saved | Get saved posts |
| GET | /api/posts/:id/comments | Get comments |
| POST | /api/posts/:id/comments | Add a comment |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages/conversations | All conversations |
| GET | /api/messages/conversations/:id | Get messages |
| POST | /api/messages/send | Send text message |
| POST | /api/messages/send-file | Send file/media |
| POST | /api/messages/:id/react | React to message |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stories | Get all stories |
| POST | /api/stories | Upload a story |
| POST | /api/stories/:id/view | Mark as viewed |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/search | Search users |
| GET | /api/users/suggested | Suggested users |
| GET | /api/users/:username | Get profile |
| GET | /api/users/:username/posts | User's posts |
| POST | /api/users/:id/follow | Follow or unfollow |
| GET | /api/users/:id/followers | Get followers |
| GET | /api/users/:id/following | Get following |
| POST | /api/users/avatar | Update avatar |

---

## Run Locally

```bash
git clone https://github.com/fizaaly/flick-app.git
cd flick-app/backend
pip install -r requirements.txt
python wsgi.py
```

Open `http://localhost:5000`

---

## Project Structure

```
flick-app/
├── backend/
│   ├── app.py              # Flask app + SocketIO setup
│   ├── wsgi.py             # Server entry point
│   ├── requirements.txt    # Python dependencies
│   ├── config/
│   │   └── database.py     # SQLAlchemy setup
│   ├── models/
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── message.py
│   │   ├── story.py
│   │   └── follow.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── posts.py
│   │   ├── messages.py
│   │   ├── stories.py
│   │   └── users.py
│   └── frontend/           # Frontend files served by Flask
├── frontend/               # Source frontend files
│   ├── index.html
│   ├── css/
│   │   └── flick.css
│   └── jss/
│       ├── api.js          # API client
│       ├── app.js          # Core app logic
│       ├── chat.js         # Chat and messaging
│       └── stories.js      # Stories viewer
└── README.md
```

---

Built with Python, Flask, and plain JavaScript. No React, no Vue, no shortcuts.
