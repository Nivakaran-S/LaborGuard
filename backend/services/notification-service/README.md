# LaborGuard Notification Service

This microservice handles the management and delivery of all platform notifications (in-app messages, system alerts, emails) for LaborGuard.

## Architecture

This service follows the **MVC** architecture pattern:
- **Models**: Defines MongoDB schema for `Notification`.
- **Controllers**: Handles request logic for creating notifications and managing read/unread state.
- **Routes**: Exposes standard RESTful API endpoints.
- **Utils**: Helper modules containing logic for Kafka events and the Resend email API.

## Third-Party Integrations

### 1. Resend (Email Delivery)
The service leverages the Resend API to dispatch high-priority notifications as HTML emails. Currently, every time a new message is received (via Kafka event) or an admin manually creates a notification with an `email` field, the `resendClient.js` helper executes the delivery.
Requires `RESEND_API_KEY` and `SYSTEM_DEFAULT_EMAIL` environment variables.

### 2. Kafka (Event Consumer)
The `index.js` file initializes a Kafka consumer that binds to the `messaging-events` topic.
When the messaging service publishes a `message_sent` event, this service iterates over the `recipientIds`, autonomously storing a structured `Notification` document into the local database and firing off an email alert using Resend.

## Endpoints

- **POST** `/api/notifications`: Manually create a notification (primarily for system/admin alerts). Include an `email` field to simultaneously send an external email.
- **GET** `/api/notifications/:userId`: Paginated fetch of all notifications belonging to a specific user.
- **GET** `/api/notifications/:userId/unread-count`: Retrieve a simple metric count of unread notifications.
- **PATCH** `/api/notifications/:id/read`: Mark a single notification document as read.
- **PATCH** `/api/notifications/:userId/read-all`: Mark all unread notifications for a user as read.
- **DELETE** `/api/notifications/:id`: Delete a notification document.

## Development Setup

```bash
# Install packages
npm install

# Run automated tests
npm run test

# Run development server
npm run dev
```
