# Veil API Backend Developer Guide

## Overview

This guide provides backend developers with information about the frontend dashboard, polls, and analytics implementation to help with backend API design and integration. This document outlines what data the frontend expects, API endpoints required, and details about each section of the application.

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard Structure](#dashboard-structure)
3. [Poll Management](#poll-management)
4. [Analytics](#analytics)
5. [User Management](#user-management)
6. [API Endpoints](#api-endpoints)
7. [WebSocket Events](#websocket-events)
8. [Redis Implementation](#redis-implementation)

## Authentication

The frontend uses a token-based authentication system:

- Authentication token is stored in `localStorage` as `auth_token`
- Users without a valid token are redirected to `/get-started`
- User authentication status is checked on dashboard page load

Backend requirements:

- Implement JWT or similar token-based authentication
- Provide token validation endpoints
- Support for Google and Twitter authentication (OAuth)
- Handle session expiration and token refresh

## Dashboard Structure

The dashboard consists of several main sections:

1. **Navigation** - Collapsible sidebar and top navbar
2. **Polls Section** - Management of all polls
3. **Analytics Section** - Visualization of user engagement metrics
4. **Activity Log** - Recent user activity
5. **Account Management** - User profile and settings

The frontend implements modals for:

- Account information
- Settings configuration
- Sign-out confirmation

## Poll Management

### Poll Structure

Each poll has the following properties:

```typescript
interface Poll {
  id: string;
  title: string;
  description: string;
  status: "active" | "draft" | "completed" | "archived";
  createdAt: string; // ISO date
  endsAt: string | null; // ISO date
  isAnonymous: boolean;
  questions: Question[];
  participants: number;
  responses: number;
}

interface Question {
  id: string;
  pollId: string;
  text: string;
  type: "multiple-choice" | "single-choice" | "text" | "rating";
  options?: string[];
  required: boolean;
  order: number;
}
```

### Poll Operations

The frontend supports the following operations:

- Create new poll
- Edit existing poll
- Delete poll
- Archive poll
- Duplicate poll
- Export poll results
- View poll analytics
- Filter polls by status
- Search polls by title/description

## Analytics

The analytics section displays various metrics about poll engagement:

### Required Metrics

1. **User Engagement**
   - Total participants over time
   - Average responses per poll
   - Response rate (%)
   - Active users

2. **Poll Performance**
   - Top performing polls
   - Completion rates
   - Drop-off points
   - Time to complete

3. **Time-based Analysis**
   - Daily/weekly/monthly trends
   - Peak usage times
   - Response delay metrics

### Data Format

The frontend expects analytics data in this format:

```typescript
interface AnalyticsData {
  timeRange: "day" | "week" | "month" | "year";
  metrics: {
    totalParticipants: number;
    activePolls: number;
    responseRate: number;
    averageCompletionTime: number;
  };
  charts: {
    participantsTrend: {
      labels: string[]; // Time periods
      data: number[]; // Count values
    };
    pollPerformance: {
      labels: string[]; // Poll names
      data: number[]; // Performance metric
    };
    // Other chart data...
  };
}
```

## User Management

User profile information required:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  profileImageUrl?: string;
  joinedAt: string; // ISO date
  settings: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
    autoJoin: boolean;
    soundEffects: boolean;
    performance: "low" | "medium" | "high";
  };
}
```

## API Endpoints

The frontend expects the following REST API endpoints:

### Authentication

- `POST /auth/login` - Login with credentials
- `POST /auth/register` - Register new user
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user info
- `GET /auth/google` - Google OAuth
- `GET /auth/twitter` - Twitter OAuth

### Polls

- `GET /polls` - List all polls with pagination/filtering
- `GET /polls/:id` - Get single poll details
- `POST /polls` - Create new poll
- `PUT /polls/:id` - Update poll
- `DELETE /polls/:id` - Delete poll
- `POST /polls/:id/duplicate` - Duplicate poll
- `PATCH /polls/:id/status` - Update poll status

### Questions

- `GET /polls/:pollId/questions` - Get poll questions
- `POST /polls/:pollId/questions` - Add question
- `PUT /questions/:id` - Update question
- `DELETE /questions/:id` - Delete question

### Responses

- `GET /polls/:pollId/responses` - Get poll responses
- `POST /polls/:pollId/responses` - Submit response
- `GET /polls/:pollId/results` - Get poll results
- `GET /polls/:pollId/export` - Export results

### Analytics

- `GET /analytics/overview` - Get overview metrics
- `GET /analytics/polls` - Get poll performance metrics
- `GET /analytics/users` - Get user engagement metrics
- `GET /analytics/trends` - Get time-based trend data
- `GET /analytics/custom` - Get custom date range analytics

### User Management

- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `PATCH /users/:id/settings` - Update user settings

## WebSocket Events

The frontend expects real-time updates through WebSocket for:

- New poll responses
- Poll status changes
- User activity updates
- Notification delivery

Sample WebSocket event structure:

```typescript
interface WebSocketEvent {
  type:
    | "poll_response"
    | "poll_status_change"
    | "user_activity"
    | "notification";
  payload: any;
  timestamp: string;
}
```

## Redis Implementation

The application uses Redis for:

1. **Temporary User Sessions**
   - Storage of user state before full registration
   - Implemented in `temp-user` module

2. **Real-time Data**
   - Caching poll results
   - Supporting WebSocket events
   - Tracking active users

3. **Rate Limiting**
   - Protecting API endpoints
   - Preventing spam submissions

Redis connection is managed by the `redis.service.ts` module.

## Room Management

Rooms are used for collaborative polling sessions:

```typescript
interface Room {
  id: string;
  name: string;
  pollId: string;
  ownerId: string;
  participants: string[]; // User IDs
  createdAt: string;
  status: "active" | "closed";
  settings: {
    allowJoin: boolean;
    showResults: boolean;
    requireAuth: boolean;
  };
}
```

Required endpoints:

- `POST /rooms` - Create room
- `GET /rooms/:id` - Get room info
- `PATCH /rooms/:id` - Update room settings
- `DELETE /rooms/:id` - Close room
- `POST /rooms/:id/join` - Join room
- `POST /rooms/:id/leave` - Leave room

---

## Performance Considerations

- All API endpoints should support pagination
- Response times should be optimized for real-time updates
- Implement proper caching strategies for analytics data
- Consider data aggregation for historical analytics
- Use proper indexing for MongoDB/database queries

## Security Requirements

- Implement proper input validation
- Use HTTPS for all communications
- Rate limit sensitive endpoints
- Implement proper CORS configuration
- Sanitize all user inputs
- Implement proper error handling without exposing sensitive information

---

For any questions or clarifications, please contact the frontend development team.
