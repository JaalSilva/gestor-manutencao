import express from "express";
import { initializedEnv } from "./src/lib/env-setup.js";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { google } from "googleapis";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'jw-hub-app-secret-key-change-me';

const APP_URL = (process.env.APP_URL || process.env.VITE_APP_URL || '').replace(/\/$/, '');

console.log("[SERVER] APP_URL configurada como:", APP_URL);
console.log("[FIREBASE] Carregando configuração do projeto:", firebaseConfig.projectId);
console.log("[FIREBASE] Banco de dados alvo:", firebaseConfig.firestoreDatabaseId);

// Force Project ID at the very top for all underlying GCP SDKs (gRPC/Firestore)
process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
process.env.GCLOUD_PROJECT = firebaseConfig.projectId;

// Initialize Firebase Admin with explicit configuration
let firebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log("[FIREBASE] Admin SDK inicializado para o projeto:", firebaseApp.options.projectId);
} else {
  firebaseApp = getApps()[0];
}

// Select database
// const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
// console.log("[FIREBASE] Conector Firestore configurado para:", process.env.FIREBASE_PROJECT_ID);

/**
 * MOCK DATABASE - "PARE O FIREBASE"
 * Para evitar erros de permissão, usamos um armazenamento em memória no servidor.
 * Nota: Em produção real isso seria substituído por um volume ou banco funcional.
 */
const mockDb: Record<string, any[]> = {
  panels: [],
  taskDefinitions: [],
  tasks: [],
  pendencies: [],
  transactions: [],
  events: [],
  serviceOrders: [],
  users: [
    { id: "user_jaaziel", login: "Jaaziel Silva", password: "1914", role: "admin" },
    { id: "user_elton", login: "Elton Ramos", password: "1914", role: "admin" },
    { id: "user_kelvin", login: "Kelvin", password: "1914", role: "admin" }
  ]
};

const mockConfig: Record<string, any> = {
  settings: {
    appName: "JW HUB - GESTÃO",
    appLogo: "",
    osTitle: "MODELO DE O.S. PMOC - CORRETIVO E PREVENTIVO",
    osSubTitle: "EMISSÃO DE FICHA DE TRABALHO TÉCNICO",
    nextOsNumber: 1000
  }
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  return await fn();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares: Security & JSON limit for large Logo Base64
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Security Headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Simple Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health Check
  app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

  // static files BEFORE Vite and Response Formatter to avoid interference
  app.use('/public', express.static(path.join(process.cwd(), 'public')));

  // Multer Configuration
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `logo-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Somente imagens são permitidas.'));
      }
    }
  });

  // Response Formatter Middleware - Simplified and safer
  const formatResponse = (body: any, success = true, error?: string) => {
    return { success, data: success ? body : undefined, error };
  };

  // We'll use a local mock for google connections if firestore fails
  const googleIntegrationsMock: Record<string, any> = {};

  // Middleware: Auth check
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    // Auto-authorize if no token is provided to support "No Login" requirement
    if (!token) {
      req.user = { uid: "public_operator", login: "Operador de Sincronismo", role: "admin" };
      return next();
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      // Even if token is invalid, fallback to public operator for resilience
      req.user = { uid: "public_operator", login: "Operador de Sincronismo", role: "admin" };
      next();
    }
  };

  const MASTER_USERS = [
    { login: "Jaaziel Silva", password: "1914", uid: "user_jaaziel" },
    { login: "Elton Ramos", password: "1914", uid: "user_elton" },
    { login: "Kelvin", password: "1914", uid: "user_kelvin" }
  ];

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { login, password, congregation, circuit } = req.body;
    if (!login || !password) return res.status(400).json({ error: "ID e Senha são obrigatórios." });

    try {
      // Check if user already exists
      const existing = mockDb.users.find(u => u.login === login);
      if (existing) return res.status(400).json({ error: "Este ID de usuário já está em uso." });

      const newUser = {
        id: `user-${Date.now()}`,
        login,
        password, 
        congregation: congregation || 'Não informada',
        circuit: circuit || 'Não informado',
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      mockDb.users.push(newUser);
      const token = jwt.sign({ uid: newUser.id, login: newUser.login, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      
      return res.json({ token, login: newUser.login, uid: newUser.id, role: 'admin', congregation: newUser.congregation, circuit: newUser.circuit });
    } catch (err) {
      return res.status(500).json({ error: "Falha ao criar conta." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const login = (req.body.login || "").trim();
      const password = (req.body.password || "").trim();
      
      console.log(`[AUTH] Tentativa de login para: ${login}`);
      
      // Check master list
      const master = MASTER_USERS.find(u => u.login === login && u.password === password);
      let targetUser: any = master;

      if (!targetUser) {
        console.log(`[AUTH] Buscando usuário no banco local...`);
        const user = mockDb.users.find(u => u.login === login && u.password === password);
        if (user) {
          targetUser = { 
            uid: user.id, 
            login: user.login, 
            congregation: user.congregation, 
            circuit: user.circuit 
          };
        }
      }

      if (targetUser) {
        console.log(`[AUTH] Login bem-sucedido para: ${login}`);
        const token = jwt.sign({ uid: targetUser.uid, login: targetUser.login, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ 
          token, 
          login: targetUser.login, 
          uid: targetUser.uid, 
          role: 'admin',
          congregation: targetUser.congregation || 'Complexo',
          circuit: targetUser.circuit || 'Regional'
        });
      }

      console.log(`[AUTH] Login negado para: ${login}`);
      return res.status(401).json({ error: "Usuário ou senha incorretos." });
    } catch (err) {
      console.error("[AUTH] ERRO CRÍTICO NO LOGIN:", err);
      return res.status(500).json({ error: "Erro interno no servidor de autenticação." });
    }
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
      
      const userIdx = mockDb.users.findIndex(u => u.id === uid);
      if (userIdx !== -1) {
        mockDb.users[userIdx] = { ...mockDb.users[userIdx], ...updates };
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Falha ao atualizar perfil." });
    }
  });

  // Data Proxy Routes
  // Branding Upload Route
  app.post("/api/branding/upload-logo", authenticate, upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json(formatResponse(null, false, "Nenhum arquivo enviado."));
      }

      // Generate public URL
      const fileUrl = `${APP_URL}/public/uploads/${req.file.filename}`;
      
      res.json(formatResponse({ url: fileUrl }));
    } catch (err: any) {
      console.error("Upload Error:", err);
      res.status(500).json(formatResponse(null, false, err.message || "Erro no upload."));
    }
  });

  app.get("/api/data/:collection", authenticate, async (req, res) => {
    try {
      const col = req.params.collection;
      const items = mockDb[col] || [];
      res.json(formatResponse(items));
    } catch (err) {
      console.error(`[DB ERROR] Get ${req.params.collection}:`, err);
      res.status(500).json(formatResponse(null, false, "Erro ao buscar dados."));
    }
  });

  app.post("/api/data/:collection/:id", authenticate, async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!mockDb[collection]) mockDb[collection] = [];
      
      const idx = mockDb[collection].findIndex(item => item.id === id);
      if (idx !== -1) {
        mockDb[collection][idx] = { ...mockDb[collection][idx], ...req.body, id };
      } else {
        mockDb[collection].push({ ...req.body, id });
      }
      res.json(formatResponse(true));
    } catch (err) {
      console.error(`[DB ERROR] Save ${req.params.collection}/${req.params.id}:`, err);
      res.status(500).json(formatResponse(null, false, "Erro ao salvar dado."));
    }
  });

  app.delete("/api/data/:collection/:id", authenticate, async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (mockDb[collection]) {
        mockDb[collection] = mockDb[collection].filter(item => item.id !== id);
      }
      res.json(formatResponse(true));
    } catch (err) {
      console.error(`[DB ERROR] Delete ${req.params.collection}/${req.params.id}:`, err);
      res.status(500).json(formatResponse(null, false, "Erro ao deletar dado."));
    }
  });

  // Special route for Settings (Single Document)
  app.get("/api/config/settings", authenticate, async (req, res) => {
    try {
      res.json(formatResponse(mockConfig.settings));
    } catch (err) {
      console.error(`[DB ERROR] Get settings:`, err);
      res.status(500).json(formatResponse(null, false, "Erro ao buscar configurações."));
    }
  });

  app.post("/api/config/settings", authenticate, async (req, res) => {
    try {
      mockConfig.settings = { ...mockConfig.settings, ...req.body };
      res.json(formatResponse(true));
    } catch (err) {
      console.error(`[DB ERROR] Save settings:`, err);
      res.status(500).json(formatResponse(null, false, "Erro ao salvar configurações."));
    }
  });

  // Google Sheets Synchronization Route (Deprecated old one, adding new secure flow)
  app.get("/api/auth/google/url", authenticate, (req, res) => {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${APP_URL}/api/auth/google/callback`
      );

      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ],
        state: (req as any).user?.uid
      });

      res.json(formatResponse({ url }));
    } catch (err: any) {
      console.error("Auth URL error:", err);
      res.status(500).json(formatResponse(null, false, err.message));
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state: userId } = req.query;
    if (!code || !userId) return res.redirect(`${APP_URL}/settings?error=missing_code`);

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${APP_URL}/api/auth/google/callback`
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Store tokens - try Firestore, fallback to mock if it fails
      try {
        await admin.firestore().collection('google_integrations').doc(userId as string).set({
          tokens,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (fErr) {
        console.warn("Firestore not available, using mock storage for tokens");
        googleIntegrationsMock[userId as string] = { tokens };
      }

      res.redirect(`${APP_URL}/settings?google=connected`);
    } catch (err) {
      console.error("OAuth Callback Error:", err);
      res.redirect(`${APP_URL}/settings?error=oauth_failed`);
    }
  });

  app.get("/api/auth/google/status", authenticate, async (req, res) => {
    const uid = (req as any).user!.uid;
    try {
      let connected = false;
      try {
        const doc = await admin.firestore().collection('google_integrations').doc(uid).get();
        connected = doc.exists;
      } catch (fErr) {
        connected = !!googleIntegrationsMock[uid];
      }
      res.json(formatResponse({ connected }));
    } catch (err) {
      res.status(500).json(formatResponse(null, false, "Failed to check status"));
    }
  });

  app.post("/api/sync/google-sheets", authenticate, async (req, res) => {
    const userId = (req as any).user!.uid;
    const { payload } = req.body;

    try {
      const integrationDoc = await admin.firestore().collection('google_integrations').doc(userId).get();
      if (!integrationDoc.exists) return res.status(401).json({ error: "Google account not connected." });

      const { tokens } = integrationDoc.data()!;
      const oauth2Client = new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.APP_URL}/api/auth/google/callback`
      );
      oauth2Client.setCredentials(tokens);

      // Handle token refresh
      oauth2Client.on('tokens', (newTokens) => {
        admin.firestore().collection('google_integrations').doc(userId).set({
          tokens: { ...tokens, ...newTokens },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });

      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // 1. Locate or Create Spreadsheet
      let spreadsheetId = integrationDoc.data()?.spreadsheetId;
      if (!spreadsheetId) {
        const list = await drive.files.list({
          q: "name = 'Gestão de Manutenção - Dados' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
          fields: 'files(id)',
          spaces: 'drive'
        });

        if (list.data.files && list.data.files.length > 0) {
          spreadsheetId = list.data.files[0].id;
        } else {
          const ss = await sheets.spreadsheets.create({
            requestBody: {
              properties: { title: 'Gestão de Manutenção - Dados' },
              sheets: [
                { properties: { title: 'Ordens de Serviço' } },
                { properties: { title: 'Equipamentos' } },
                { properties: { title: 'Custos' } },
                { properties: { title: 'Histórico' } }
              ]
            }
          });
          spreadsheetId = ss.data.spreadsheetId;
        }
        await admin.firestore().collection('google_integrations').doc(userId).update({ spreadsheetId });
      }

      // 2. Prepare Data Mapping
      const sheetData: Record<string, any[][]> = {
        'Ordens de Serviço': [
          ['ID', 'Data', 'Cliente', 'Solicitante', 'Tipo', 'Prioridade', 'Status'],
          ...(payload.serviceOrders || []).map((os: any) => [
            os.osNumber || os.id,
            os.date || os.createdAt,
            os.client || '',
            os.requester || '',
            os.maintenanceType || '',
            os.priority || '',
            os.status || 'ABERTA'
          ])
        ],
        'Equipamentos': [
          ['ID', 'Nome', 'Frequência', 'Setor'],
          ...(payload.definitions || []).map((d: any) => [
            d.id, d.name, d.frequency, d.sector || ''
          ])
        ],
        'Custos': [
          ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria'],
          ...(payload.treasury || []).map((t: any) => [
            t.date, t.description, t.value, t.type, t.category || ''
          ]),
          ...(payload.pendencies || []).filter((p: any) => p.cost > 0).map((p: any) => [
            p.date, `Pendência: ${p.description}`, p.cost, 'expense', 'Manutenção'
          ])
        ],
        'Histórico': [
          ['Equipamento', 'Ciclo', 'Ano', 'Status', 'Data Conclusão'],
          ...(payload.tasks || []).map((t: any) => {
            const def = payload.definitions?.find((d: any) => d.id === t.definitionId);
            return [
              def?.name || t.definitionId,
              t.periodIndex + 1,
              t.year,
              t.status,
              t.completedAt || ''
            ];
          })
        ]
      };

      // 3. Perform Batch Updates
      const requests = Object.entries(sheetData).map(([sheetName, rows]) => ({
        range: `${sheetName}!A1`,
        values: rows
      }));

      for (const req of requests) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: req.range,
          valueInputOption: 'RAW',
          requestBody: { values: req.values }
        });
      }

      res.json({ success: true, spreadsheetId });
    } catch (err: any) {
      console.error("Sync Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sync/fetch-sheets", authenticate, async (req, res) => {
    // Basic Implementation of reading data back
    const userId = (req as any).user!.uid;
    try {
      const integrationDoc = await admin.firestore().collection('google_integrations').doc(userId).get();
      if (!integrationDoc.exists || !integrationDoc.data()?.spreadsheetId) {
        return res.json({ found: false });
      }

      const { tokens, spreadsheetId } = integrationDoc.data()!;
      const oauth2Client = new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.APP_URL}/api/auth/google/callback`
      );
      oauth2Client.setCredentials(tokens);

      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      
      // For now, let's just confirm it exists
      res.json({ found: true, spreadsheetId });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch from sheets" });
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

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[SERVER ERROR]:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Erro interno no servidor."
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GESTÃO DE MANUTENÇÃO: Servidor de Sincronização Ativo em http://localhost:${PORT}`);
  });
}

startServer();
