# SRU MentorHub — Client Application

The official frontend web application for **SRU MentorHub**, built with **React 19**, **Vite**, and **Tailwind CSS**.

---

## 🚀 Available Scripts

In the `client` directory, you can run:

- `npm run dev` or `npm run start`  
  Runs the app in development mode at `http://localhost:5173`. Automatic hot-reloading (HMR) is enabled.
- `npm run build`  
  Compiles and bundles the production app into the `dist/` directory.
- `npm run preview`  
  Locally previews the production build.
- `npm run lint`  
  Runs `oxlint` static code analysis.

---

## 🎨 UI Architecture & Design System

- **Dual Theme Support**: Light Slate canvas and Dark Obsidian/Slate-950 mode with smooth transitions and persistent state.
- **Iconography**: `lucide-react` modern minimalist icons.
- **Charts & Visualization**: `recharts` for student analytics, mock interview scoring, and weekly targets progress.
- **Routing**: `react-router-dom` with strict Role-Based Access Control (RBAC) route guards (`ADMIN`, `TRAINER`, `MENTOR`, `MENTEE`).
- **SPA Deployment**: Includes `vercel.json` and `public/_redirects` for zero-configuration client-side routing.

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# In development, leave blank or empty to use Vite proxy (/api/v1 -> localhost:5001)
# In production, specify the deployed backend API URL:
VITE_API_URL="https://your-backend-api.onrender.com/api/v1"
```
