# Community Service

Community Management Service for the LaborGuard platform. Handles user profiles, posts, comments, statuses, reports, and content moderation.

## Features

- **User Profiles** — Create, follow/unfollow, bookmarks
- **Posts** — CRUD, likes, shares, polls, hashtag search, trending feed
- **Comments** — Add, list, delete on posts
- **Statuses** — Ephemeral content (auto-expires in 24h)
- **Reports** — Report posts, comments, or users
- **Content Moderation** — Perspective API (toxic text) + NSFWJS (inappropriate images)
- **Media Uploads** — Cloudinary integration for images/videos

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| Kafka (KafkaJS) | Event-driven messaging |
| Cloudinary | Media storage (images/videos) |
| Perspective API | Text toxicity detection |
| NSFWJS + TensorFlow.js | Image content moderation |
| Docker | Containerization |

## Third-Party APIs

### Google Perspective API
- **Purpose:** Detects toxic, abusive, or harmful text content in posts, comments, and statuses
- **How it works:** Sends text to Google's Perspective API and receives a toxicity score (0–1). Content scoring above the threshold (default 0.7) is blocked with a `403` response
- **Endpoint used:** `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze`
- **Docs:** https://perspectiveapi.com
- **Required env var:** `PERSPECTIVE_API_KEY`

### Cloudinary
- **Purpose:** Cloud-based media storage and delivery for user-uploaded images and videos
- **How it works:** Files are uploaded via `upload_stream` to the `laborguard-community` folder on Cloudinary. The returned `secure_url` is stored in MongoDB
- **Supported formats:** JPEG, PNG, GIF, WebP, MP4, MOV, AVI
- **Docs:** https://cloudinary.com/documentation
- **Required env vars:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### NSFWJS (TensorFlow.js)
- **Purpose:** Client-side image classification to detect and block inappropriate/NSFW images before they are uploaded to Cloudinary
- **How it works:** Uses a pre-trained TensorFlow.js model to classify images into 5 categories (Neutral, Drawing, Sexy, Porn, Hentai). If the combined score of Porn + Hentai + Sexy exceeds the threshold (default 0.5), the upload is blocked with a `403` response
- **Docs:** https://github.com/infinitered/nsfwjs
- **Optional env var:** `NSFW_THRESHOLD`

## User Roles

| Role | Description |
|------|-------------|
| `worker` | Default — labor workers |
| `lawyer` | Legal professionals |
| `ngo_representative` | NGO representatives |
| `employer` | Employers |
| `admin` | Platform administrators |

## Project Structure

```
community-service/
├── src/
│   ├── index.js                    # Entry point
│   ├── controllers/
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   ├── statusController.js
│   │   ├── reportController.js
│   │   └── userProfileController.js
│   ├── models/
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Status.js
│   │   ├── Report.js
│   │   └── UserProfile.js
│   ├── routes/
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── statusRoutes.js
│   │   ├── reportRoutes.js
│   │   └── userProfileRoutes.js
│   ├── middleware/
│   │   ├── contentModeration.js    # Perspective API text check
│   │   └── imageModeration.js      # NSFWJS image check
│   └── utils/
│       ├── kafkaProducer.js
│       ├── perspectiveApi.js
│       ├── cloudinaryConfig.js
│       └── nsfwCheck.js
├── tests/                          # Jest unit tests
├── Dockerfile
├── package.json
└── .dockerignore
```

## API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Service info |

### Profiles (`/api/profiles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create or update profile |
| GET | `/:userId` | Get profile by user ID |
| POST | `/follow` | Follow a user |
| POST | `/unfollow` | Unfollow a user |
| POST | `/bookmark` | Toggle bookmark on a post |
| GET | `/:userId/bookmarks` | Get user's bookmarks |

### Posts (`/api/posts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create post (multipart, moderated) |
| GET | `/feed/:userId` | Get user feed |
| GET | `/trending` | Get trending posts |
| GET | `/hashtag/:tag` | Search by hashtag |
| GET | `/:postId` | Get post by ID |
| PUT | `/:postId` | Update post (multipart, moderated) |
| DELETE | `/:postId` | Delete post |
| POST | `/:postId/like` | Like/unlike post |
| POST | `/:postId/share` | Share post |
| POST | `/:postId/poll` | Vote on poll |
| POST | `/:postId/report` | Report post |

### Comments (`/api/comments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:postId` | Add comment (moderated) |
| GET | `/:postId` | Get comments for post |
| DELETE | `/:commentId` | Delete comment |
| POST | `/:commentId/report` | Report comment |

### Statuses (`/api/statuses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create status (multipart, moderated) |
| GET | `/feed/:userId` | Get statuses feed |
| DELETE | `/:statusId` | Delete status |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create report |
| GET | `/` | Get reports (filterable by status) |
| PUT | `/:reportId/status` | Update report status |

## Content Moderation Pipeline

```
Upload Request
  → multer (memoryStorage, max 50MB)
  → NSFWJS image check (blocks if Porn+Hentai+Sexy ≥ 0.5)
  → Perspective API text check (blocks if toxicity ≥ 0.7)
  → Controller (uploads to Cloudinary, saves to MongoDB)
```

All moderation features gracefully degrade — if API keys are missing or services fail, content is allowed through with a console warning.

## Environment Variables

```env
PORT=3002
SERVICE_NAME=community-service
MONGODB_URI=mongodb://localhost:27017/laborguard
KAFKA_BROKER=localhost:9092

# Perspective API
PERSPECTIVE_API_KEY=your_key
TOXICITY_THRESHOLD=0.7

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# NSFWJS
NSFW_THRESHOLD=0.5
```

## Running

### Local Development
```bash
npm install
npm run dev
```

### Docker
```bash
# From the backend/ directory
docker-compose up -d mongodb zookeeper kafka community-service
```

### Tests
```bash
npm test
```
