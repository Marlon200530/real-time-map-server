# Map Challenge Backend (Render)

## Stack
- Node.js + Express
- Socket.IO

## Local Run
```bash
npm install
npm run dev
```

Health endpoint:
`GET /health`

## Environment Variables
- `PORT` (optional): defaults to `3001`
- `CORS_ORIGIN` (optional): comma-separated allowed frontend origins
  - Example: `https://my-map.vercel.app`
  - Example: `https://my-map.vercel.app,https://my-map-git-main-user.vercel.app`
  - Supports wildcard: `https://*.vercel.app`

If `CORS_ORIGIN` is empty, all origins are accepted.

## Render Deploy
Create a Web Service with:
- `Root Directory`: `server` (if monorepo)
- `Build Command`: `npm install`
- `Start Command`: `npm start`
- `Environment`: Node

Set env vars in Render:
- `CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN.vercel.app`

After deploy, copy backend URL:
- `https://YOUR_BACKEND.onrender.com`
