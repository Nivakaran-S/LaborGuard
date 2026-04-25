// DUPLICATE: keep in sync with community-service/src/utils/eventTypes.js

const AUTH_EVENTS = Object.freeze({
  USER_REGISTERED: 'user_registered',
  USER_WARNED: 'user_warned',
  USER_SUSPENDED: 'user_suspended',
  USER_BANNED: 'user_banned',
});

const TOPICS = Object.freeze({
  COMMUNITY: 'community-events',
  COMPLAINT: 'complaint-events',
  AUTH: 'auth-events',
  MESSAGING: 'messaging-events',
});

module.exports = { AUTH_EVENTS, TOPICS };
