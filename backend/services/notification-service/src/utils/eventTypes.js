// DUPLICATE: keep in sync with community-service/src/utils/eventTypes.js
// and complaint-service/src/utils/eventTypes.js

const COMMUNITY_EVENTS = Object.freeze({
  POST_LIKED: 'post_liked',
  POST_COMMENTED: 'post_commented',
  USER_FOLLOWED: 'user_followed',
  FOLLOW_REQUESTED: 'follow_requested',
  FOLLOW_REQUEST_APPROVED: 'follow_request_approved',
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_SUPPORTED: 'campaign_supported',
  CAMPAIGN_UPDATE_POSTED: 'campaign_update_posted',
  REPORT_RESOLVED: 'report_resolved',
});

const COMPLAINT_EVENTS = Object.freeze({
  COMPLAINT_STATUS_UPDATED: 'complaint_status_updated',
  COMPLAINT_ASSIGNED: 'complaint_assigned',
  COMPLAINT_SHARED_TO_COMMUNITY: 'complaint_shared_to_community',
});

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

module.exports = { COMMUNITY_EVENTS, COMPLAINT_EVENTS, AUTH_EVENTS, TOPICS };
