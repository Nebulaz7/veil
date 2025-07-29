# Veil

Veil is a real-time anonymous Q&A platform designed for events, livestreams, and interactive sessions. It empowers audiences to ask questions without revealing their identity, and gives moderators full control to filter, highlight, and respond — all in a sleek, live-updating interface.

## ✨ Features

- **Anonymous Q&A** – Attendees can ask questions without logging in
- **Live WebSocket Updates** – See questions in real time without refresh
- **Moderator Dashboard** – View, filter, answer, and hide questions
- **Audience Upvoting** – Surface popular questions via likes
- **Poll Creation** – Run simple polls to gather quick feedback
- **Room Codes** – Easily join sessions using a 6-character code
- **Session Management** – Organize and revisit rooms per event

## 🛠️ Tech Stack

| Layer          | Tech                          |
|----------------|-------------------------------|
| Frontend       | Next.js 14, TailwindCSS, Shadcn UI, Lucide Icons |
| Backend        | NestJS (WebSocket + REST API) |
| Database       | Prisma + PostgreSQL           |
| Authentication | Passport.js                   |
| Infra          | Render (API), Vercel (Frontend) |
| Realtime       | WebSockets (via socket.io)    |
| Other          | TypeScript, Turbo Monorepo, ESM Modules |

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/cridiv/Veil.git
cd Veil
```

### 2. Install Dependencies
```bash
pnpm install
```


### 3. Set Up Environment Variables
Create a `.env` file in the root and include:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/veil_db

# Authentication
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key

# OAuth (if using social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

**Note:** Be sure to also add these in Vercel and Render during deployment.

### 4. Database Setup
Set up your PostgreSQL database and run migrations:
```bash
cd apps/api
pnpm run db:migrate
pnpm run db:seed  # Optional: seed with sample data
```

### 5. Run the App Locally
Run both backend and frontend in separate terminals:

**Backend (NestJS)**
```bash
cd apps/api
pnpm run start:dev
```

**Frontend (Next.js)**
```bash
cd apps/web
pnpm dev
```
## 🌐 Deployment

### 📡 Backend (Render)
1. Connect repo on Render
2. Set root directory to `apps/api`
3. Add environment variables
4. Build command:
```bash
pnpm install && pnpm run build
```
5. Start command:
```bash
pnpm run start:prod
```

### 🌍 Frontend (Vercel)
1. Connect repo on Vercel
2. Set root directory to `apps/web`
3. Add all environment variables
4. Deploy

## 🔐 Authentication

Veil uses Passport.js for flexible authentication strategies:

- **Local Strategy** – Username/password authentication for moderators
- **JWT Tokens** – Secure session management
- **Anonymous Access** – No authentication required for audience participation
- **OAuth Support** – Google, GitHub, and other providers (optional)

## 🤝 Contributing

We welcome all contributions!

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make changes and commit: `git commit -m "feat: your feature"`
4. Push the branch: `git push origin feat/your-feature-name`
5. Open a pull request 🎉

## 👨‍💻 Authors

* **Aderemi Ademola** – Backend Lead, Realtime Systems (X: [@crid_iv](https://x.com/Crid_IV))
* **Peters Joshua** – Frontend Lead, UX Engineer (X: [@joshpet77](https://x.com/joshpet77))
* **Oyedapo Kayode** – Product Designer (X: [@Kayode_96](https://x.com/Kayode_96))

## 📜 License

This project is licensed under the **MIT License**.

---

Built to make questions speak louder than names. 🫶
