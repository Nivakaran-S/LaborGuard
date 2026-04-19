# LaborGuard Messaging Service

This microservice handles all real-time messaging between users across the LaborGuard platform (admin, worker, employer, lawyer, ngo_representative).

## Architecture

This service follows the **MVC** architecture pattern:
- **Models**: Defines MongoDB schemas for `Conversation` and `Message`.
- **Controllers**: Handles all request logic for fetching conversations, creating messages, and updating message states.
- **Routes**: Exposes standard RESTful API endpoints.
- **Utils**: Helper modules containing logic for Kafka, Cloudinary, and Centrifugo.

## Third-Party Integrations

### 1. Kafka (Event Streaming)
The service publishes a `message_sent` event to the `messaging-events` topic every time a message is sent. The `notification-service` is listening to this topic and instantly creates database push notifications and external emails via Resend.

### 2. Centrifugo (Real-Time Messaging)
When a user sends a message, after saving it to the database, the backend automatically publishes the message payload to the Centrifugo API on the `chat:<conversation_id>` channel. Connected frontend clients subscribed to this channel will instantly receive the message via WebSocket without polling.
Requires `CENTRIFUGO_API_KEY` and `CENTRIFUGO_API_URL` environment variables.

### 3. Cloudinary (Media Storage)
Messages support multi-part media uploads (images/videos). If files are uploaded through the `sendMessage` endpoint, they are piped directly into Cloudinary using our Multer memory storage adapter, generating secure URLs saved within the message payload.
Requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` environment variables.

## Endpoints

### 1. Conversations
- **POST** `/api/conversations`: Create a new 1-on-1 or group conversation.
- **GET** `/api/conversations/:userId`: Get all conversations participating by `userId` (Paginated, newest first).

### 2. Messages
- **GET** `/api/messages/:conversationId`: Fetch paginated messages within a specific conversation.
- **POST** `/api/messages`: Send a new message. Supports `multipart/form-data` where `media` can be an array of files. Automatically triggers Cloudinary, Kafka, and Centrifugo.
- **PATCH** `/api/messages/:conversationId/read`: Mark all messages within a conversation as read by a targeted user.
- **DELETE** `/api/messages/:messageId`: Hard-delete your own message.

## Development Setup

```bash
# Install packages
npm install

# Run automated tests
npm run test

# Run development server
npm run dev
```
