import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = 'jw-hub-app-secret-key-change-me';

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

// Select database
const db = new admin.firestore.Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware: Auth check
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Restrict Guest to Read-Only
      if (decoded.role === 'guest' && req.method !== 'GET') {
        return res.status(403).json({ error: "Acesso de convidado é apenas para leitura." });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: "Sessão inválida." });
    }
  };

  const MASTER_USERS = [
    { login: "Jaaziel Silva", password: "1914", uid: "user_jaaziel" },
    { login: "Elton Ramos", password: "1914", uid: "user_elton" },
    { login: "Kelvin", password: "1914", uid: "user_kelvin" }
  ];

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { login, password } = req.body;
    
    // Check master list first
    const master = MASTER_USERS.find(u => u.login === login && u.password === password);
    let targetUser: any = master;

    if (!targetUser) {
      try {
        const snapshot = await db.collection('users').where('login', '==', login).limit(1).get();
        if (!snapshot.empty) {
          const u = snapshot.docs[0].data();
          if (u.password === password) {
            targetUser = { uid: snapshot.docs[0].id, login: u.login };
          }
        }
      } catch (err) {
        console.error("User search failed:", err);
      }
    }

    if (targetUser) {
      const token = jwt.sign({ uid: targetUser.uid, login: targetUser.login, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, login: targetUser.login, uid: targetUser.uid, role: 'admin' });
    }

    return res.status(401).json({ error: "Nome ou senha incorretos." });
  });

  app.post("/api/auth/guest", async (req, res) => {
    // Guest token with restricted role
    const token = jwt.sign({ uid: "guest_user", login: "Convidado", role: 'guest' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, login: "Convidado", uid: "guest_user", role: 'guest' });
  });

  app.post("/api/auth/update", authenticate, async (req, res) => {
    const { newLogin, newPassword } = req.body;
    const uid = (req as any).user.uid;
    try {
      const updates: any = { updatedAt: new Date().toISOString() };
      if (newLogin) updates.login = newLogin;
      if (newPassword) updates.password = newPassword;
      await db.collection('users').doc(uid).set(updates, { merge: true });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Falha ao atualizar perfil." });
    }
  });

  // Data Proxy Routes
  app.get("/api/data/:collection", authenticate, async (req, res) => {
    try {
      const col = req.params.collection;
      const snapshot = await db.collection(col).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar dados." });
    }
  });

  app.post("/api/data/:collection/:id", authenticate, async (req, res) => {
    try {
      const { collection, id } = req.params;
      await db.collection(collection).doc(id).set(req.body, { merge: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao salvar dado." });
    }
  });

  app.delete("/api/data/:collection/:id", authenticate, async (req, res) => {
    try {
      const { collection, id } = req.params;
      await db.collection(collection).doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao deletar dado." });
    }
  });

  // Special route for Settings (Single Document)
  app.get("/api/config/settings", authenticate, async (req, res) => {
    try {
      const doc = await db.collection('config').doc('settings').get();
      res.json(doc.exists ? doc.data() : null);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar configurações." });
    }
  });

  app.post("/api/config/settings", authenticate, async (req, res) => {
    try {
      await db.collection('config').doc('settings').set(req.body, { merge: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao salvar configurações." });
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
       res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GESTÃO DE MANUTENÇÃO: Servidor de Sincronização Ativo em http://localhost:${PORT}`);
  });
}

startServer();
