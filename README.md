# Baba Finance & Billing System

Professional Full-Stack Management Tool for sports group financial management, athlete billing, and match statistics.

## Developed by
**Jaal Silva**

## Core Features
- **Hybrid Domain Persistence**: Dual-layer storage using local SQLite (instant caching) and Firebase Firestore (cloud synchronization).
- **Automated Billing**: Integration for athlete payment tracking with automatic Fair Play scoring incentives.
- **Real-time Statistics**: Interactive dashboard for goal tracking, disciplinary records (fouls), and attendance history.
- **Self-Healing Infrastructure**: Automatic recovery from Cloud propagation delays and ephemeral restart restoration.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, Socket.IO.
- **Database**: SQLite (better-sqlite3) & Firestore.
- **Reporting**: jsPDF for financial and statistics export.

## Deployment
This system is ready for deployment on **Cloud Run** or **Vercel**.

### Vercel Deployment Note
Ensure you configure the `GOOGLE_CLOUD_PROJECT` and other Firebase environment variables in the Vercel dashboard.

---
*© 2026 Developed by Jaal Silva. Enterprise Grade Solution.*
