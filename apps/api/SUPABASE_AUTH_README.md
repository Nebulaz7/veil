# Supabase Authentication Setup

## Overview

This project has been refactored to use Supabase for authentication instead of Passport.js for Google and Twitter/X OAuth providers.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create an account if you don't have one.
2. Create a new project and note your project URL and anon key.

### 2. Configure Authentication Providers

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Google and Twitter/X providers
3. Configure the providers with your credentials:

   **For Google:**
   - Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add the following redirect URI to your Google OAuth settings:
     `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret to Supabase

   **For Twitter/X:**
   - Create a Twitter/X app in the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Add the following callback URL to your Twitter app:
     `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
   - Copy the API Key and API Secret Key to Supabase

### 3. Configure Environment Variables

1. Copy the `.env.sample` file to `.env`
2. Fill in the following variables:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   AUTH_REDIRECT_URL=https://veil-1qpe.onrender.com/auth/callback
   JWT_SECRET=your-jwt-secret
   ```

## Authentication Flow

1. User clicks the login button on the frontend
2. The frontend redirects to `/auth/google` or `/auth/twitter`
3. The backend redirects to Supabase OAuth
4. After authentication, Supabase redirects to the callback URL
5. The backend exchanges the code for a session
6. The backend creates a custom JWT token and redirects to the frontend
7. The frontend receives the token and stores it for future API calls

## API Endpoints

- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/twitter` - Initiates Twitter/X OAuth flow
- `GET /auth/callback` - Callback endpoint for both providers

## Additional Information

- To change the redirect URL, update the `AUTH_REDIRECT_URL` environment variable
- Make sure your Supabase project has the correct redirect URL set for both providers
