/**
 * BABA FINANCE & BILLING SYSTEM - SERVER CORE
 * Professional Full-Stack Management Tool
 * 
 * Developed by: Jaal Silva
 * Version: 2.0.0 (Enterprise Mode)
 * 
 * This server handles:
 * - Hybrid Persistence (SQLite + Firestore)
 * - Automatic Data Recovery & Restoration
 * - Athlete Billing & Notification Logic
 * - Real-time statistics aggregation
 */

import express from 'express';
console.log("[DEBUG] server.ts execution started");
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { v4 } from 'uuid';
const uuidv4 = v4;
import axios from 'axios';
import { createServer } from 'http';
import * as socketio from 'socket.io';
const { Server } = socketio;
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  // Global Error Handlers for robust booting
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
  });
  process.on('unhandledRejection', (reason: any, promise) => {
    if (reason?.message?.includes('PERMISSION_DENIED')) {
      console.warn('⚠️ [STABLE] Firestore Permission Denied (Handled):', reason.message);
    } else {
      console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    }
  });

  app.use(express.json());

  // Load Firebase Config
  let firebaseConfig: any = {};
  try {
    const configPath = path.join(__dirname, 'firebase-applet-config.json');
    console.log(`[BOOT] Reading Firebase config from ${configPath}...`);
    firebaseConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log("[BOOT] Firebase config loaded.");
    
    // EXPLICITLY set the environment variable for the project ID
    if (firebaseConfig.projectId) {
      process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
      console.log(`[BOOT] Set process.env.GOOGLE_CLOUD_PROJECT to ${firebaseConfig.projectId}`);
    }
  } catch (e) {
    console.error("[BOOT] Failed to load firebase-applet-config.json:", e);
  }

  // Initialize Firebase Admin
  try {
    const adminConfig: any = {
      projectId: firebaseConfig.projectId
    };

    if (!admin.apps.length) {
      console.log("[BOOT] Initializing Firebase Admin with Project ID:", firebaseConfig.projectId);
      admin.initializeApp(adminConfig);
    } else {
      console.log("[BOOT] Firebase Admin already initialized. Project:", admin.app().options.projectId);
      if (admin.app().options.projectId !== firebaseConfig.projectId && firebaseConfig.projectId) {
        console.warn(`[BOOT] Project ID mismatch! Config: ${firebaseConfig.projectId}, Environment: ${admin.app().options.projectId}`);
      }
    }
  } catch (e) {
    console.error("[BOOT] Firebase Admin initialization failed:", e);
  }

  // Define Firestore instance with guard
  let firestore: any;
  let isFirestoreAccessible = false;
  try {
    if (admin.apps.length > 0) {
      const dbId = firebaseConfig.firestoreDatabaseId;
      console.log(`[BOOT] Connecting to Firestore (Database: ${dbId || '(default)'})...`);
      
      const potentialFirestore = dbId 
        ? getFirestore(admin.app(), dbId)
        : getFirestore(admin.app());
      
      // Connectivity check with timeout
      console.log("[BOOT] Testing Firestore connectivity (3s timeout)...");
      const connectivityTest = potentialFirestore.collection('app_settings').limit(1).get();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3000));
      
      try {
        await Promise.race([connectivityTest, timeoutPromise]);
        firestore = potentialFirestore;
        isFirestoreAccessible = true;
        console.log("✅ [BOOT] Firestore connected and accessible.");
      } catch (readErr: any) {
        if (readErr.message === 'TIMEOUT') {
          console.warn("⚠️ [BOOT] Firestore connectivity test timed out (3s). Proceeding with local-only mode.");
        } else if (readErr.message.includes('PERMISSION_DENIED')) {
          console.warn("⚠️ [BOOT] Firestore found but lacks read permissions. Cloud sync will be disabled.");
        } else {
          console.warn("⚠️ [BOOT] Firestore connectivity test failed:", readErr.message);
        }
        firestore = null;
        isFirestoreAccessible = false;
      }
    } else {
      console.warn("[BOOT] Firebase Admin not initialized. Firestore functionality will be disabled.");
    }
  } catch (e) {
    console.error("[BOOT] Critical failure during Firestore initialization:", e);
    firestore = null;
  }

  // Database Initialization (SQLite as fallback/migration source)
  const dbPath = path.resolve(__dirname, 'finance.db');
  let db: any;
  try {
    console.log(`[BOOT] Opening SQLite database at ${dbPath}...`);
    db = new Database(dbPath, { timeout: 5000 });
    console.log("[BOOT] SQLite database opened.");
  } catch (e) {
    console.error("[BOOT] Failed to open SQLite database:", e);
    // As a last resort, try an in-memory database or fail gracefully.
    console.log("[BOOT] Falling back to in-memory database...");
    db = new Database(':memory:');
  }

  // Pre-parse SQLite JSON fields if getting match_session
  const parseSessionFromSQLite = (row: any) => {
    if (!row) return row;
    const session = { ...row };
    if (typeof session.team_a === 'string') {
      try { session.team_a = JSON.parse(session.team_a); } catch (e) {}
    }
    if (typeof session.team_b === 'string') {
      try { session.team_b = JSON.parse(session.team_b); } catch (e) {}
    }
    session.is_extra_time = !!session.is_extra_time;
    return session;
  };
  
  // Helper to notify all clients
  const notifyUpdate = (type: string, data?: any) => {
    io.emit('data:updated', { type, data, timestamp: new Date().toISOString() });
  };
  // Helper for audit logs
  const addSystemLog = async (operation: string, entity: string, entityId: string, details: string) => {
    if (!firestore) {
      console.warn("[SYSTEM] Firestore not initialized, skipping log:", operation, details);
      // Fallback to SQLite for logs?
      try {
        db.prepare('INSERT INTO system_logs (id, operation, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), operation, entity, entityId, details, new Date().toISOString());
      } catch (e) {}
      return;
    }
    try {
      const logId = uuidv4();
      await firestore.collection('system_logs').doc(logId).set({
        id: logId,
        operation,
        entity,
        entity_id: entityId,
        details,
        created_at: new Date().toISOString()
      });
    } catch (e: any) {
      if (!e.message.includes('PERMISSION_DENIED')) {
        console.error("Failed to log operation, falling back to SQLite:", e);
      }
      try {
        db.prepare('INSERT INTO system_logs (id, operation, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), operation, entity, entityId, details, new Date().toISOString());
      } catch (err) {}
    }
  };

  // Silent Migration Logic
  const migrateToFirestore = async () => {
    if (!firestore || !isFirestoreAccessible) return;
    try {
      console.log("[MIGRATION] Checking Firestore data...");
      const playersCheck = await firestore.collection('players').limit(1).get().catch((err: any) => {
        if (err.message.includes('PERMISSION_DENIED')) isFirestoreAccessible = false;
        return { empty: true };
      });
      if (!isFirestoreAccessible) return;
      
      const firestorePlayersCount = playersCheck.empty ? 0 : 1; 
      if (playersCheck.empty) {
        console.log("[MIGRATION] Firestore is empty. Starting silent migration from SQLite...");
        const tables = ['players', 'senders', 'attendance', 'fair_play', 'matches', 'app_settings', 'match_session', 'billing_logs'];
        let totalCount = 0;
        for (const table of tables) {
          try {
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            if (rows.length > 0) {
              const batchSize = 500;
              for (let i = 0; i < rows.length; i += batchSize) {
                const batch = firestore.batch();
                const chunk = rows.slice(i, i + batchSize);
                chunk.forEach((row: any) => {
                  const docRef = firestore.collection(table).doc(String(row.id || row.key || uuidv4()));
                  batch.set(docRef, { ...row, migrated_at: new Date().toISOString() });
                });
                await batch.commit();
              }
              totalCount += rows.length;
            }
          } catch (e) {}
        }
        await addSystemLog('MIGRATION', 'SYSTEM', 'initial', `Migrated ${totalCount} records.`);
      }
    } catch (e) {
      console.error("[MIGRATION] Failed:", e);
    }
  };

  // Restore FROM Firestore (for ephemeral persistence)
  const restoreFromFirestore = async () => {
    if (!firestore || !isFirestoreAccessible) return;
    try {
      console.log("[RESTORE] Checking if local DB needs restoration from Firestore...");
      const playersCount = db.prepare('SELECT count(*) as count FROM players').get().count;
      console.log(`[RESTORE] Current local athletes: ${playersCount}`);
      
      if (playersCount <= 40) {
        const firestorePlayers = await firestore.collection('players').get().catch((err: any) => {
          if (err.message.includes('PERMISSION_DENIED')) isFirestoreAccessible = false;
          throw err;
        });
        
        if (!isFirestoreAccessible) return;
        
        if (!firestorePlayers.empty) {
          console.log(`[RESTORE] Found ${firestorePlayers.size} records in Firestore. Restoring local cache...`);
          const tables = ['players', 'matches', 'fair_play', 'attendance', 'app_settings', 'match_session'];
          for (const table of tables) {
            try {
              const snap = await firestore.collection(table).get();
              if (!snap.empty) {
                const rows = snap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
                for (const row of rows) {
                  const cleanedRow = { ...row };
                  if (cleanedRow.migrated_at) delete cleanedRow.migrated_at;
                  const rowId = cleanedRow.id || cleanedRow.key;
                  delete cleanedRow.id;
                  
                  // Convert objects/arrays to JSON for SQLite compatibility
                  Object.keys(cleanedRow).forEach(key => {
                    if (cleanedRow[key] !== null && typeof cleanedRow[key] === 'object' && !(cleanedRow[key] instanceof Date)) {
                      cleanedRow[key] = JSON.stringify(cleanedRow[key]);
                    }
                  });

                  const keys = Object.keys(cleanedRow);
                  const values = Object.values(cleanedRow);
                  const placeholders = keys.map(() => '?').join(', ');
                  const setClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
                  
                  if (table === 'app_settings') {
                    db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value`).run(rowId, row.value);
                  } else {
                    db.prepare(`INSERT INTO ${table} (id, ${keys.join(', ')}) VALUES (?, ${placeholders}) ON CONFLICT(id) DO UPDATE SET ${setClause}`).run(rowId, ...values);
                  }
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (e: any) {
      if (e.message?.includes('PERMISSION_DENIED')) {
        console.warn("[RESTORE] Permission denied to cloud data. Staying local-only.");
        isFirestoreAccessible = false;
      } else {
        console.error("[RESTORE] Failed:", e);
      }
    }
  };

  // Initialize and Migrate
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      congregation TEXT,
      age INTEGER,
      status_payment TEXT CHECK(status_payment IN ('PAGO', 'PENDENTE')) DEFAULT 'PENDENTE',
      payment_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS senders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      status TEXT CHECK(status IN ('CONECTADO', 'DESCONECTADO')) DEFAULT 'CONECTADO',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      player_id TEXT,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('PRESENTE', 'AUSENTE', 'JUSTIFICADO')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS fair_play (
      id TEXT PRIMARY KEY,
      player_id TEXT,
      score INTEGER NOT NULL,
      reason TEXT,
      category TEXT CHECK(category IN ('PRESENCA', 'PAGAMENTO', 'COMPORTAMENTO', 'ADVERTENCIA', 'GOL', 'ASSISTENCIA')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS match_session (
      id TEXT PRIMARY KEY,
      duration_remaining INTEGER DEFAULT 600,
      is_running INTEGER DEFAULT 0,
      start_time TEXT,
      team_a TEXT,
      team_b TEXT,
      current_gk_index_a INTEGER DEFAULT 0,
      current_gk_index_b INTEGER DEFAULT 0,
      is_extra_time INTEGER DEFAULT 0,
      matches_count_session INTEGER DEFAULT 0,
      total_elapsed_seconds INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS billing_logs (
      id TEXT PRIMARY KEY,
      player_id TEXT,
      sender_id TEXT,
      phone TEXT,
      status TEXT,
      message TEXT,
      error_details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (sender_id) REFERENCES senders(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      team_a_score INTEGER DEFAULT 0,
      team_b_score INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.prepare('CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)').run();

    // Seed default settings if empty
    const settingsCheck = db.prepare('SELECT count(*) as count FROM app_settings').get() as { count: number };
    if (settingsCheck.count === 0) {
      console.log("[SEEDER] Initializing default app settings...");
      const defaults = [
        ['baba_name', 'Amigos da Bola ⚽'],
        ['primary_color', '#FF5C00'],
        ['secondary_color', '#1D1D1F'],
        ['resenha_balance', '0'],
        ['language', 'pt'],
        ['spreadsheet_id', ''],
        ['google_client_id', ''],
        ['make_webhook_url', '']
      ];
      const insertSetting = db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)');
      defaults.forEach(([k, v]) => insertSetting.run(k, v));
    }
  } catch (e) {
    console.error("[BOOT] Failed to initialize app_settings:", e);
  }

  // Ensure column exists for match_session
  try { db.prepare("ALTER TABLE match_session ADD COLUMN matches_count_session INTEGER DEFAULT 0").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE match_session ADD COLUMN total_elapsed_seconds INTEGER DEFAULT 0").run(); } catch(e) {}
  console.log("[BOOT] Migrated match_session: Added columns check");

  // Seeder for requested athletes
  const getAthletesList = () => [
    "Jaal Silva", "Eduardo Santos", "Leandro SPTO", "Ruan Luz", "Ed Willian", 
    "Alexandre BIgode", "André", "Ben-Hur", "Bira", "Caio", "César", 
    "Danilo", "Domingos", "Elias", "Fagner", "Flavio", "Isaac", "Islan", 
    "Jasdon", "Jonata", "Jonathan", "Josemiro", "Leandro Cortes", "Lourival", 
    "Mateus", "Mauricio", "Miguel", "Ruan Nicolas", "Samuel", "Thiago", 
    "Vitor", "Willian", "David Amaral", "Marcio", "Max", "Panda", "Givago", 
    "Felipe", "Luan", "Pedro", "Gustavo", "Igor", "Léo", "Dudu", "Neto", 
    "Tico", "Meco", "Lula", "Bolsonaro", "Ciro", "Moro", "Jaaziel Silva", 
    "Jean", "Carlos Alberto", "Geniselmo", "Thiago Gonzaga", "Matias"
  ];

  const seedAthletes = async () => {
    const athletes = getAthletesList();
    console.log("[SEEDER] Checking for missing athletes...");
    const insertStmt = db.prepare('INSERT INTO players (id, name, phone, congregation, age, status_payment, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const checkStmt = db.prepare('SELECT id FROM players WHERE name = ?');
    
    let count = 0;
    for (const name of athletes) {
      const exists = checkStmt.get(name);
      let id: string;
      const now = new Date().toISOString();
      
      if (!exists) {
        id = uuidv4();
        try {
          insertStmt.run(id, name, '00000000000', 'Amigos da Bola', '0', 'PENDENTE', now);
          count++;
          console.log(`[SEEDER] Inserted athlete locally: ${name}`);
        } catch (e: any) {
          console.error(`[SEEDER] Error inserting ${name} locally:`, e.message);
          continue;
        }
      } else {
        id = (exists as any).id;
      }

      // Always try to sync to Firestore if we are in this loop and it's missing there
      if (firestore && isFirestoreAccessible) {
        firestore.collection('players').doc(id).get().then((doc: any) => {
          if (!doc.exists) {
            firestore.collection('players').doc(id).set({
              id, name, phone: '00000000000', congregation: 'Amigos da Bola', age: '0', 
              status_payment: 'PENDENTE', updated_at: now, created_at: now
            }).then(() => console.log(`[SEEDER] Synced to Cloud: ${name}`))
              .catch((e: any) => console.error(`[SEEDER] Firestore sync failed for ${name}:`, e.message));
          }
        }).catch(() => {});
      }
    }
    if (count > 0) console.log(`[SEEDER] Added ${count} new athletes.`);
    else console.log("[SEEDER] All athletes checked.");
    return count;
  };
  
  // Run on boot
  seedAthletes();

  app.post('/api/admin/seed-athletes', async (req, res) => {
    try {
      const count = await seedAthletes();
      res.json({ success: true, added: count });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Initialize and Migrate (Non-blocking)
  console.log("[BOOT] Database initialized. Starting recovery and migration check...");
  if (firestore) {
    restoreFromFirestore().then(() => {
      return migrateToFirestore();
    }).then(() => {
      console.log("[BOOT] Database sync cycle finished.");
    }).catch(err => {
      console.error("[BOOT] Database sync failed:", err);
    });
  } else {
    console.log("[BOOT] Firestore not available, falling back to local-only mode.");
  }

  console.log("[BOOT] Initializing default settings...");
  const defaultSettings = [
    { key: 'baba_name', value: 'Amigos da Bola ⚽' },
    { key: 'primary_color', value: '#FF5C00' },
    { key: 'secondary_color', value: '#1D1D1F' },
    { key: 'resenha_balance', value: '0' }
  ];
  for (const s of defaultSettings) {
    db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)').run(s.key, s.value);
  }

  console.log("[BOOT] Checking schema evolution...");
  // Migration for schema evolution
  try {
    const tableInfo = db.prepare("PRAGMA table_info(billing_logs)").all() as any[];
    if (!tableInfo.some(col => col.name === 'sender_id')) {
      db.exec("ALTER TABLE billing_logs ADD COLUMN sender_id TEXT REFERENCES senders(id)");
    }
    if (!tableInfo.some(col => col.name === 'error_details')) {
      db.exec("ALTER TABLE billing_logs ADD COLUMN error_details TEXT");
    }

    const playerTableInfo = db.prepare("PRAGMA table_info(players)").all() as any[];
    if (!playerTableInfo.some(col => col.name === 'congregation')) {
      db.exec("ALTER TABLE players ADD COLUMN congregation TEXT");
    }
    if (!playerTableInfo.some(col => col.name === 'age')) {
      db.exec("ALTER TABLE players ADD COLUMN age INTEGER");
    }

    const sessionTableInfo = db.prepare("PRAGMA table_info(match_session)").all() as any[];
    if (!sessionTableInfo.some(col => col.name === 'team_a')) {
      db.exec("ALTER TABLE match_session ADD COLUMN team_a TEXT");
    }
    if (!sessionTableInfo.some(col => col.name === 'team_b')) {
      db.exec("ALTER TABLE match_session ADD COLUMN team_b TEXT");
    }
    if (!sessionTableInfo.some(col => col.name === 'current_gk_index_a')) {
      db.exec("ALTER TABLE match_session ADD COLUMN current_gk_index_a INTEGER DEFAULT 0");
    }
    if (!sessionTableInfo.some(col => col.name === 'current_gk_index_b')) {
      db.exec("ALTER TABLE match_session ADD COLUMN current_gk_index_b INTEGER DEFAULT 0");
    }
    if (!sessionTableInfo.some(col => col.name === 'is_extra_time')) {
      db.exec("ALTER TABLE match_session ADD COLUMN is_extra_time INTEGER DEFAULT 0");
    }
  } catch (e) {
    console.error("[BOOT] Migration error:", e);
  }

  console.log("[BOOT] Seeding senders...");
  // Seed Senders
  const seedSenders = [
    { id: uuidv4(), name: 'Admin Principal', phone: '+5571992561612' },
    { id: uuidv4(), name: 'Admin Secundário', phone: '+5571992966741' }
  ];
  for (const sender of seedSenders) {
    db.prepare('INSERT OR IGNORE INTO senders (id, name, phone) VALUES (?, ?, ?)').run(sender.id, sender.name, sender.phone);
  }

  console.log("[BOOT] Checking match session...");
  // Initialize match session if not exists
  const session = db.prepare('SELECT * FROM match_session LIMIT 1').get();
  if (!session) {
    db.prepare('INSERT INTO match_session (id, duration_remaining, is_running) VALUES (?, ?, ?)')
      .run('current_match', 600, 0);
  }

  console.log("[BOOT] Setting up routes...");
  // API Routes - Admin & Sync
  app.post('/api/admin/force-migration', async (req, res) => {
    try {
      await migrateToFirestore();
      res.json({ success: true, message: 'Migration process triggered. Check server logs for details.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/sync-status', async (req, res) => {
    let cloudAccessible = false;
    let recordsCount: any = {};
    if (firestore) {
      try {
        const check = await firestore.collection('app_settings').limit(1).get();
        cloudAccessible = true;
        // Optional: Count records if accessible
      } catch (e) {}
    }

    try {
      const tables = ['players', 'matches', 'fair_play', 'attendance'];
      for(const t of tables) {
        recordsCount[t] = db.prepare(`SELECT count(*) as count FROM ${t}`).get().count;
      }
    } catch(e) {}

    res.json({ 
      cloud_sync_enabled: !!firestore,
      cloud_accessible: cloudAccessible,
      local_records: recordsCount,
      local_db_path: dbPath,
      is_ephemeral: true, // Always true in this Cloud Run environment
      timestamp: new Date().toISOString()
    });
  });

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      firestore: !!firestore,
      sqlite: !!db
    });
  });

  // API Routes - Match & Timer
  app.get('/api/match/timer', async (req, res) => {
    const fallbackSession = () => {
      try {
        let session = db.prepare('SELECT * FROM match_session WHERE id = "current_match"').get();
        if (session) {
          session = parseSessionFromSQLite(session);
          if (session.is_running) {
            const elapsed = Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000);
            const remaining = Math.max(0, session.duration_remaining - elapsed);
            return { ...session, duration_remaining: remaining };
          }
          return session;
        }
        return { id: 'current_match', duration_remaining: 600, is_running: 0 };
      } catch (e) {
        return { id: 'current_match', duration_remaining: 600, is_running: 0 };
      }
    };

    if (!firestore || !isFirestoreAccessible) return res.json(fallbackSession());
    try {
      const sessionDoc = await firestore.collection('match_session').doc('current_match').get();
      const local = fallbackSession();
      let session = sessionDoc.exists ? sessionDoc.data() as any : local;
      
      // If Firestore is NOT running but local IS, local wins (container is more up to date)
      if (local.is_running && !session.is_running) {
        session = local;
      }
      
      if (session.is_running) {
        const elapsed = Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000);
        const remaining = Math.max(0, session.duration_remaining - elapsed);
        const total_elapsed = (session.total_elapsed_seconds || 0) + elapsed;
        return res.json({ ...session, duration_remaining: remaining, total_elapsed_seconds: total_elapsed });
      }
      res.json(session);
    } catch (e: any) {
      res.json(fallbackSession());
    }
  });

  app.post('/api/match/timer/control', async (req, res) => {
    const { action, duration, session: updatedSession } = req.body;
    let currentSession: any = { id: 'current_match', duration_remaining: 600, is_running: 0 };
    
    // Get current state
    try {
      const row = db.prepare('SELECT * FROM match_session WHERE id = "current_match"').get();
      if (row) currentSession = parseSessionFromSQLite(row);
    } catch (e) {}

    let update: any = { last_updated: new Date().toISOString() };

    if (action === 'START') {
      update.is_running = 1;
      update.start_time = new Date().toISOString();
      if (duration) {
        update.duration_remaining = duration;
      } else if (!currentSession.duration_remaining || currentSession.duration_remaining <= 0) {
        update.duration_remaining = 600;
      }
    } else if (action === 'PAUSE') {
      let elapsed = 0;
      if (currentSession.start_time) {
        elapsed = Math.floor((new Date().getTime() - new Date(currentSession.start_time).getTime()) / 1000);
      }
      const remaining = Math.max(0, currentSession.duration_remaining - elapsed);
      update.is_running = 0;
      update.duration_remaining = remaining;
      update.total_elapsed_seconds = (currentSession.total_elapsed_seconds || 0) + elapsed;
      update.start_time = null; // Important to avoid double-counting if paused again
    } else if (action === 'RESET') {
      update.is_running = 0;
      update.duration_remaining = duration || 600;
      update.total_elapsed_seconds = 0;
      update.team_a = null;
      update.team_b = null;
      update.is_extra_time = false;
      update.current_gk_index_a = 0;
      update.current_gk_index_b = 0;
      update.matches_count_session = 0;
    } else if (action === 'INCREMENT_MATCH_COUNT') {
      update.matches_count_session = (currentSession.matches_count_session || 0) + 1;
      
      // Auto-record a "match part" in the matches table to increment the counter
      const matchId = uuidv4();
      const dateStr = new Date().toISOString().slice(0, 10);
      const nowStr = new Date().toISOString();
      try {
        db.prepare('INSERT INTO matches (id, date, team_a_score, team_b_score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(matchId, dateStr, 0, 0, `Auto: Partida ${update.matches_count_session}`, nowStr);
        
        if (firestore) {
          firestore.collection('matches').doc(matchId).set({
            id: matchId, date: dateStr, team_a_score: 0, team_b_score: 0, 
            notes: `Auto: Partida ${update.matches_count_session}`, created_at: nowStr
          }).catch(() => {});
        }
        notifyUpdate('MATCHES');
      } catch (e) {}
    } else if (action === 'EXTRA') {
      update.is_running = 1;
      update.start_time = new Date().toISOString();
      const extraSecs = duration || 120;
      update.duration_remaining = (currentSession.duration_remaining || 0) + extraSecs;
      update.is_extra_time = true;
    } else if (action === 'UPDATE') {
      update.duration_remaining = duration;
    } else if (action === 'UPDATE_SESSION') {
      Object.assign(update, updatedSession);
    }

    const finalSession = { ...currentSession, ...update };

    // SQLite
    try {
      const sqliteSession = { ...finalSession };
      // Convert arrays/objects to JSON for SQLite
      if (sqliteSession.team_a) sqliteSession.team_a = JSON.stringify(sqliteSession.team_a);
      if (sqliteSession.team_b) sqliteSession.team_b = JSON.stringify(sqliteSession.team_b);
      if (sqliteSession.is_extra_time !== undefined) sqliteSession.is_extra_time = sqliteSession.is_extra_time ? 1 : 0;

      const keys = Object.keys(sqliteSession);
      const values = Object.values(sqliteSession);
      const placeholders = keys.map(() => '?').join(', ');
      const setClause = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
      db.prepare(`INSERT INTO match_session (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${setClause}`).run(...values);
    } catch (e: any) {
      console.error("SQLite timer update failed:", e.message);
    }

    // Firestore (NON-BLOCKING to ensure local reactivity)
    if (firestore && isFirestoreAccessible) {
      firestore.collection('match_session').doc('current_match').set(finalSession, { merge: true }).catch((e: any) => {
        console.error("⚠️ [SYNC] Firestore timer sync failed:", e.message);
        if (e.message.includes('PERMISSION_DENIED')) isFirestoreAccessible = false;
      });
    }

    notifyUpdate('TIMER_CONTROL', finalSession);
    console.log(`[TIMER] ${action} executed. Running: ${finalSession.is_running}, Rem: ${finalSession.duration_remaining}`);
    res.json(finalSession);
  });

  app.get('/api/stats/monthly', async (req, res) => {
    const calculateStats = (playersData: any[], fairPlayEvents: any[], matchesData: any[]) => {
      const topScorersMap = new Map();
      const mostFoulsMap = new Map();
      const fairPlayRankingMap = new Map();

      playersData.forEach(p => {
        topScorersMap.set(p.id, { name: p.name, goals: 0 });
        mostFoulsMap.set(p.id, { name: p.name, fouls: 0 });
        fairPlayRankingMap.set(p.id, { name: p.name, total_score: 0 });
      });

      fairPlayEvents.forEach(ev => {
        // Stats aggregation
        if (ev.category === 'GOL') {
          const current = topScorersMap.get(ev.player_id) || { name: 'Atleta Externo', goals: 0 };
          topScorersMap.set(ev.player_id, { ...current, goals: current.goals + 1 });
        }
        if (ev.category === 'ADVERTENCIA') {
          const current = mostFoulsMap.get(ev.player_id) || { name: 'Atleta Externo', fouls: 0 };
          mostFoulsMap.set(ev.player_id, { ...current, fouls: current.fouls + 1 });
        }
        
        // Fair play score
        const rCurrent = fairPlayRankingMap.get(ev.player_id) || { name: 'Atleta Externo', total_score: 0 };
        fairPlayRankingMap.set(ev.player_id, { ...rCurrent, total_score: rCurrent.total_score + ev.score });
      });

      return {
        topScorers: Array.from(topScorersMap.values()).filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5),
        mostFouls: Array.from(mostFoulsMap.values()).filter(s => s.fouls > 0).sort((a, b) => b.fouls - a.fouls).slice(0, 5),
        fairPlayRanking: Array.from(fairPlayRankingMap.values()).sort((a, b) => b.total_score - a.total_score).slice(0, 5),
        matches: matchesData
      };
    };

    const fallbackStats = () => {
      try {
        const monthStart = new Date().toISOString().slice(0, 7) + '-01';
        const monthEnd = new Date().toISOString().slice(0, 7) + '-31';
        const players = db.prepare('SELECT id, name FROM players').all();
        const fairPlay = db.prepare('SELECT player_id, score, category FROM fair_play WHERE created_at >= ? AND created_at <= ?').all(monthStart, monthEnd);
        const matches = db.prepare('SELECT * FROM matches WHERE date >= ? AND date <= ? ORDER BY date DESC').all(monthStart, monthEnd);
        return calculateStats(players, fairPlay, matches);
      } catch (e) {
        return { topScorers: [], mostFouls: [], fairPlayRanking: [], matches: [] };
      }
    };

    if (!firestore) return res.json(fallbackStats());
    try {
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const fairPlaySnap = await firestore.collection('fair_play')
        .where('created_at', '>=', `${month}-01`)
        .where('created_at', '<=', `${month}-31`)
        .get();
      
      const playersSnap = await firestore.collection('players').get();
      const playersData = playersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

      const events = fairPlaySnap.docs.map((d: any) => ({ ...d.data() }));
      
      const matchesSnap = await firestore.collection('matches')
        .where('date', '>=', `${month}-01`)
        .where('date', '<=', `${month}-31`)
        .orderBy('date', 'desc')
        .get();
      const matchesData = matchesSnap.docs.map((d: any) => d.data());

      res.json(calculateStats(playersData, events, matchesData));
    } catch (e: any) {
      if (!e.message.includes('PERMISSION_DENIED')) {
        console.error("Stats fetch failed, falling back to SQLite:", e.message);
      }
      res.json(fallbackStats());
    }
  });

  app.post('/api/matches', async (req, res) => {
    const { team_a_score, team_b_score, notes } = req.body;
    const id = uuidv4();
    const date = new Date().toISOString().slice(0, 10);
    const createdAt = new Date().toISOString();
    
    // Always persist to SQLite
    try {
      db.prepare('INSERT INTO matches (id, date, team_a_score, team_b_score, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, date, team_a_score, team_b_score, notes, createdAt);
    } catch (e: any) {
      console.error("SQLite match insert failed:", e.message);
    }

    if (firestore) {
      try {
        const matchData = { id, date, team_a_score, team_b_score, notes, created_at: createdAt };
        await firestore.collection('matches').doc(id).set(matchData);
      } catch (e: any) {
        console.error("Firestore match sync failed:", e.message);
      }
    }

    await addSystemLog('CREATE', 'MATCH', id, `Registered match with score ${team_a_score}x${team_b_score}`);
    notifyUpdate('MATCHES');
    res.json({ success: true, id });
  });

  // API Routes - App Settings
  app.get('/api/settings', async (req, res) => {
    const fallbackSettings = () => {
      try {
        const rows = db.prepare('SELECT key, value FROM app_settings').all();
        const settingsObj: any = {};
        rows.forEach((r: any) => settingsObj[r.key] = r.value);
        if (Object.keys(settingsObj).length === 0) {
           return { baba_name: 'Baba Elite', primary_color: '#FF5C00', secondary_color: '#1D1D1F', resenha_balance: '0', google_client_id: '' };
        }
        return settingsObj;
      } catch (e) {
        return { baba_name: 'Baba Elite', primary_color: '#FF5C00', secondary_color: '#1D1D1F', resenha_balance: '0' };
      }
    };

    if (!firestore) return res.json(fallbackSettings());
    try {
      const settingsSnap = await firestore.collection('app_settings').get();
      const settingsObj: any = {};
      settingsSnap.forEach((d: any) => {
        settingsObj[d.id] = d.data().value;
      });
      if (Object.keys(settingsObj).length === 0) {
        return res.json(fallbackSettings());
      }
      res.json(settingsObj);
    } catch (e: any) {
      if (!e.message.includes('PERMISSION_DENIED')) {
        console.error("Settings fetch failed, falling back to SQLite:", e.message);
      }
      res.json(fallbackSettings());
    }
  });

  app.post('/api/settings', async (req, res) => {
    const { settings } = req.body;
    
    // Always persist to SQLite
    try {
      const stmt = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
      const tx = db.transaction((settingsObj: any) => {
        for (const [key, value] of Object.entries(settingsObj)) {
          stmt.run(key, value);
        }
      });
      tx(settings);
    } catch (e: any) {
      console.error("SQLite settings update failed:", e.message);
    }

    if (firestore) {
      try {
        const batch = firestore.batch();
        for (const [key, value] of Object.entries(settings)) {
          batch.set(firestore.collection('app_settings').doc(key), { value });
        }
        await batch.commit();
      } catch (e: any) {
        console.error("Firestore settings sync failed:", e.message);
      }
    }

    await addSystemLog('UPDATE', 'SETTINGS', 'global', 'Updated application settings');
    notifyUpdate('SETTINGS');
    res.json({ success: true });
  });

  // API Routes - Players
  app.get('/api/players', async (req, res) => {
    const fallbackPlayers = () => {
      try {
        return db.prepare('SELECT * FROM players ORDER BY name ASC').all();
      } catch (e) {
        return [];
      }
    };

    const currentMonth = new Date().toISOString().slice(0, 7);

    // SQLite Reset Check
    try {
      const lastResetRow = db.prepare('SELECT value FROM app_settings WHERE key = "last_payment_reset"').get();
      const lastReset = lastResetRow ? lastResetRow.value : null;
      if (lastReset !== currentMonth) {
         db.prepare('UPDATE players SET status_payment = "PENDENTE", payment_date = NULL, updated_at = ?').run(new Date().toISOString());
         db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES ("last_payment_reset", ?)').run(currentMonth);
         console.log(`[SQLITE] Monthly payment reset for ${currentMonth}`);
      }
    } catch (e) {}

    // Firestore Reset Check
    if (firestore && isFirestoreAccessible) {
      try {
        const lastResetSnap = await firestore.collection('app_settings').doc('last_payment_reset').get();
        const lastReset = lastResetSnap.exists ? lastResetSnap.data()?.value : null;
        
        if (lastReset !== currentMonth) {
          console.log(`[SYSTEM] Monthly payment reset detected for ${currentMonth}.`);
          const playersSnap = await firestore.collection('players').get();
          const batch = firestore.batch();
          playersSnap.forEach((p: any) => {
            batch.update(p.ref, { status_payment: 'PENDENTE', payment_date: null, updated_at: new Date().toISOString() });
          });
          batch.set(firestore.collection('app_settings').doc('last_payment_reset'), { value: currentMonth });
          await batch.commit();
          await addSystemLog('SYSTEM', 'PLAYERS', 'monthly_reset', `Automated monthly reset for ${currentMonth}`);
        }
      } catch (e: any) {
        // Silently fail firestore reset if permissions are missing
        if (e.message.includes('PERMISSION_DENIED')) {
          isFirestoreAccessible = false;
        } else {
          console.error('Firestore payment reset check failed:', e.message);
        }
      }
    }

    if (!firestore || !isFirestoreAccessible) return res.json(fallbackPlayers());
    try {
      const playersSnap = await firestore.collection('players').orderBy('name', 'asc').get();
      const cloudPlayers = playersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      const localPlayers = fallbackPlayers();
      
      // Merge: Local players that are not in Cloud yet
      const cloudIds = new Set(cloudPlayers.map((p: any) => p.id));
      const unsyncedPlayers = localPlayers.filter((p: any) => !cloudIds.has(p.id));
      
      if (unsyncedPlayers.length > 0) {
        console.log(`[SYNC] Found ${unsyncedPlayers.length} unsynced local athletes. Merging display.`);
      }
      
      const merged = [...cloudPlayers, ...unsyncedPlayers].sort((a, b) => a.name.localeCompare(b.name));
      res.json(merged);
    } catch (e: any) {
      if (!e.message.includes('PERMISSION_DENIED')) {
        console.error("Players fetch failed, falling back to SQLite:", e.message);
      }
      res.json(fallbackPlayers());
    }
  });

  app.post('/api/players', async (req, res) => {
    const { name, phone, congregation, age } = req.body;
    if (!name) return res.status(400).json({ error: 'O nome é obrigatório' });
    const finalPhone = phone || '00000000000';
    const id = uuidv4();
    const playerData = { 
      id, 
      name, 
      phone: finalPhone, 
      congregation: congregation || null, 
      age: age || null, 
      status_payment: 'PENDENTE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // SQLite Persistence
    try {
      db.prepare('INSERT INTO players (id, name, phone, congregation, age, status_payment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, name, finalPhone, playerData.congregation, playerData.age, playerData.status_payment, playerData.created_at, playerData.updated_at);
      console.log(`[STABLE] Local persist success: ${name}`);
    } catch (e: any) {
      console.error("❌ [ERROR] SQLite player insert failed:", e.message);
      // We continue because maybe Firestore will work, or at least we don't crash
    }

    // FIREBASE SYNC (NON-BLOCKING)
    if (firestore && isFirestoreAccessible) {
      firestore.collection('players').doc(id).set(playerData).catch((e: any) => {
        if (e.message.includes('PERMISSION_DENIED')) {
          console.warn("⚠️ [SYNC] Firestore permissions lost during POST.");
          isFirestoreAccessible = false;
        } else {
          console.error("⚠️ [SYNC] Firestore player sync failed:", e.message);
        }
      });
    }

    // AUDIT LOG (NON-BLOCKING)
    addSystemLog('CREATE', 'PLAYER', id, `Added player: ${name}`).catch(() => {});
    
    notifyUpdate('PLAYERS');
    console.log(`[SUCCESS] Player ${name} processed. Returning result.`);
    return res.json(playerData);
  });

  app.patch('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone, congregation, age, status_payment } = req.body;
    const update: any = { updated_at: new Date().toISOString() };
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (congregation) update.congregation = congregation;
    if (age !== undefined) update.age = age;
    if (status_payment) {
      update.status_payment = status_payment;
      const pDate = req.body.payment_date || new Date().toISOString();
      update.payment_date = (status_payment === 'PAGO') ? pDate : null;

      // Handle Early Payment Bonus (Day 5)
      if (status_payment === 'PAGO' && pDate) {
        const dayPaid = new Date(pDate).getDate();
        if (dayPaid <= 5) {
          const fpId = uuidv4();
          const fpScore = 10;
          const fpReason = `Bônus Pagamento Antecipado (${new Date(pDate).toLocaleDateString('pt-BR')})`;
          const fpCategory = 'PAGAMENTO';
          const fpCreated = new Date().toISOString();

          try {
            db.prepare('INSERT INTO fair_play (id, player_id, score, reason, category, created_at) VALUES (?, ?, ?, ?, ?, ?)')
              .run(fpId, id, fpScore, fpReason, fpCategory, fpCreated);
            if (firestore) {
              firestore.collection('fair_play').doc(fpId).set({ id: fpId, player_id: id, score: fpScore, reason: fpReason, category: fpCategory, created_at: fpCreated });
            }
            console.log(`[BONUS] Awarded 10 points to athlete ${id} for early payment.`);
          } catch (e) {}
        }
      }
    }

    // SQLite
    try {
      const fields = Object.keys(update).map(k => `${k} = ?`).join(', ');
      const values = Object.values(update);
      db.prepare(`UPDATE players SET ${fields} WHERE id = ?`).run(...values, id);
    } catch (e: any) {
      console.error("SQLite player update failed:", e.message);
    }

    if (firestore && isFirestoreAccessible) {
      firestore.collection('players').doc(id).update(update).catch((e: any) => {
        if (e.message.includes('PERMISSION_DENIED')) {
          isFirestoreAccessible = false;
        } else {
          console.error("Firestore player update failed:", e.message);
        }
      });
    }

    addSystemLog('UPDATE', 'PLAYER', id, `Updated player info: ${JSON.stringify(Object.keys(update))}`).catch(() => {});
      
    if (status_payment === 'PAGO' || status_payment === 'PAGAMENTO') {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const isEarly = now.getDate() <= 5;
      const score = isEarly ? 10 : 0;
      const reason = isEarly ? 'Bônus: Pagamento até dia 05' : 'Pagamento mensal';
      const fpId = uuidv4();
      const fpDate = now.toISOString();

      // SQLite Fair Play
      try {
        db.prepare('INSERT INTO fair_play (id, player_id, score, reason, category, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(fpId, id, score, reason, 'PAGAMENTO', fpDate);
      } catch (e) {}

      if (firestore && isFirestoreAccessible && score !== 0) {
        firestore.collection('fair_play').doc(fpId).set({
          id: fpId, player_id: id, score, reason, category: 'PAGAMENTO', created_at: fpDate
        }).catch((e: any) => {
          if (e.message.includes('PERMISSION_DENIED')) isFirestoreAccessible = false;
        });
      }
    }

    notifyUpdate('PLAYERS');
    notifyUpdate('RANKING');
    res.json({ success: true });
  });

  app.delete('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    // SQLite
    try {
      db.prepare('DELETE FROM players WHERE id = ?').run(id);
    } catch (e) {}

    if (firestore && isFirestoreAccessible) {
      firestore.collection('players').doc(id).delete().catch((e: any) => {
        if (e.message.includes('PERMISSION_DENIED')) isFirestoreAccessible = false;
      });
    }
    
    addSystemLog('DELETE', 'PLAYER', id, 'Removed player from system').catch(() => {});
    notifyUpdate('PLAYERS');
    notifyUpdate('RANKING');
    res.json({ success: true });
  });

  // API Routes - Attendance
  app.get('/api/attendance', async (req, res) => {
    const fallbackAttendance = () => {
      try {
        const logs = db.prepare('SELECT a.*, p.name as player_name FROM attendance a LEFT JOIN players p ON a.player_id = p.id ORDER BY a.date DESC').all();
        return logs;
      } catch (e) {
        return [];
      }
    };

    if (!firestore) return res.json(fallbackAttendance());
    try {
      const attendanceSnap = await firestore.collection('attendance').orderBy('date', 'desc').get();
      const playersSnap = await firestore.collection('players').get();
      const playersMap = new Map(playersSnap.docs.map(d => [d.id, (d.data() as any).name]));

      const logs = attendanceSnap.docs.map(d => {
        const data = d.data() as any;
        return { ...data, player_name: playersMap.get(data.player_id) || 'Unknown' };
      });
      res.json(logs);
    } catch (e: any) {
      res.json(fallbackAttendance());
    }
  });

  app.post('/api/attendance', async (req, res) => {
    const { player_id, date, status } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    // SQLite
    try {
      db.prepare('INSERT INTO attendance (id, player_id, date, status, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, player_id, date, status, createdAt);
    } catch (e: any) {
      console.error("SQLite attendance insert failed:", e.message);
    }

    if (firestore) {
      try {
        await firestore.collection('attendance').doc(id).set({ id, player_id, date, status, created_at: createdAt });
      } catch (e: any) {
        console.error("Firestore attendance sync failed:", e.message);
      }
    }
    
    let score = 0;
    if (status === 'PRESENTE') score = 10;
    if (status === 'JUSTIFICADO') score = 5;
    
    if (score !== 0) {
      const fpId = uuidv4();
      const fpData = { id: fpId, player_id, score, reason: `Presença em ${date}`, category: 'PRESENCA', created_at: createdAt };
      
      // SQLite
      try {
        db.prepare('INSERT INTO fair_play (id, player_id, score, reason, category, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .run(fpId, player_id, score, fpData.reason, fpData.category, createdAt);
      } catch (e) {}

      if (firestore) {
        try {
          await firestore.collection('fair_play').doc(fpId).set(fpData);
        } catch (e) {}
      }
    }

    await addSystemLog('CREATE', 'ATTENDANCE', id, `Registered ${status} for player on ${date}`);
    notifyUpdate('ATTENDANCE');
    notifyUpdate('RANKING');
    res.json({ success: true });
  });

  // API Routes - Fair Play & Ranking
  app.get('/api/fairplay/ranking', async (req, res) => {
    const calculateRanking = (playersData: any[], fairPlayEvents: any[]) => {
      const rankingMap = new Map();
      playersData.forEach(p => {
        rankingMap.set(p.id, { name: p.name, phone: p.phone, total_score: 0 });
      });

      fairPlayEvents.forEach(f => {
        if (rankingMap.has(f.player_id)) {
          const current = rankingMap.get(f.player_id);
          rankingMap.set(f.player_id, { ...current, total_score: current.total_score + f.score });
        }
      });

      return Array.from(rankingMap.values()).sort((a, b) => b.total_score - a.total_score);
    };

    const fallbackRanking = () => {
      try {
        const players = db.prepare('SELECT id, name, phone FROM players').all();
        const fairPlay = db.prepare('SELECT player_id, score FROM fair_play').all();
        return calculateRanking(players, fairPlay);
      } catch (e) {
        return [];
      }
    };

    if (!firestore) return res.json(fallbackRanking());
    try {
      const playersSnap = await firestore.collection('players').get();
      const playersData = playersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

      const fairPlaySnap = await firestore.collection('fair_play').get();
      const events = fairPlaySnap.docs.map((d: any) => d.data());

      res.json(calculateRanking(playersData, events));
    } catch (e: any) {
      res.json(fallbackRanking());
    }
  });

  app.post('/api/fairplay/event', async (req, res) => {
    const { player_id, score, reason, category } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    // SQLite
    try {
      db.prepare('INSERT INTO fair_play (id, player_id, score, reason, category, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, player_id, score, reason, category, createdAt);
    } catch (e) {}

    if (firestore) {
      try {
        await firestore.collection('fair_play').doc(id).set({
          id, player_id, score, reason, category, created_at: createdAt
        });
      } catch (e) {}
    }

    await addSystemLog('CREATE', 'FAIR_PLAY', id, `Manual points ${score} for ${category}: ${reason}`);
    notifyUpdate('RANKING');
    res.json({ success: true });
  });

  // API Routes - Senders & Logs
  app.get('/api/senders', async (req, res) => {
    const fallbackSenders = () => {
      try {
        return db.prepare('SELECT * FROM senders').all();
      } catch (e) {
        return [];
      }
    };
    if (!firestore) return res.json(fallbackSenders());
    try {
      const sendersSnap = await firestore.collection('senders').get();
      const senders = sendersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      res.json(senders);
    } catch (e: any) {
      res.json(fallbackSenders());
    }
  });

  app.get('/api/logs', async (req, res) => {
    const fallbackLogs = () => {
      try {
        const logs = db.prepare(`
          SELECT b.*, p.name as player_name, s.name as sender_name 
          FROM billing_logs b 
          LEFT JOIN players p ON b.player_id = p.id 
          LEFT JOIN senders s ON b.sender_id = s.id 
          ORDER BY b.created_at DESC LIMIT 100
        `).all();
        return logs;
      } catch (e) {
        return [];
      }
    };
    if (!firestore) return res.json(fallbackLogs());
    try {
      const logsSnap = await firestore.collection('billing_logs').orderBy('created_at', 'desc').limit(100).get();
      const playersSnap = await firestore.collection('players').get();
      const sendersSnap = await firestore.collection('senders').get();
      
      const playersMap = new Map(playersSnap.docs.map(d => [d.id, (d.data() as any).name]));
      const sendersMap = new Map(sendersSnap.docs.map(d => [d.id, (d.data() as any).name]));

      const logs = logsSnap.docs.map(d => {
        const data = d.data() as any;
        return { 
          ...data, 
          player_name: playersMap.get(data.player_id) || 'Unknown', 
          sender_name: sendersMap.get(data.sender_id) || 'Unknown' 
        };
      });
      res.json(logs);
    } catch (e: any) {
      res.json(fallbackLogs());
    }
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  app.post('/api/charge-late', async (req, res) => {
    const { sender_id } = req.body;
    let sender: any = null;
    let pendingPlayers: any[] = [];

    // Try Firestore first for sender and players
    if (firestore) {
      try {
        const senderDoc = await firestore.collection('senders').doc(sender_id).get();
        sender = senderDoc.exists ? senderDoc.data() : null;
        
        const playersSnap = await firestore.collection('players').where('status_payment', '==', 'PENDENTE').get();
        pendingPlayers = playersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      } catch (e) {}
    }

    // Fallback to SQLite
    if (!sender) {
      try {
        sender = db.prepare('SELECT * FROM senders WHERE id = ?').get(sender_id);
      } catch (e) {}
    }
    if (pendingPlayers.length === 0) {
      try {
        pendingPlayers = db.prepare('SELECT * FROM players WHERE status_payment = "PENDENTE"').all();
      } catch (e) {}
    }

    if (!sender) return res.status(400).json({ error: 'Sender not found' });
    
    res.status(202).json({ message: `Processamento de ${pendingPlayers.length} cobranças iniciado.` });
    await addSystemLog('CHARGE', 'BILLING', sender_id, `Started billing process for ${pendingPlayers.length} players.`);

    // Async processing loop
    (async () => {
      for (const player of pendingPlayers) {
        const message = `Querido amigo da bola, chegou o dia pra pagar nossa brincadeira semanal. A chave pix ta no grupo do baba. Seus 40 reais é necessario para garantir o pagamento do espaço. OBRIGADO`;
        await delay(2000 + Math.random() * 3000); 
        
        const status = 'SUCCESS'; // In a real scenario, this would depend on the WhatsApp API callback
        const logId = uuidv4();
        const createdAt = new Date().toISOString();

        // Save log to SQLite
        try {
          db.prepare('INSERT INTO billing_logs (id, player_id, sender_id, phone, status, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(logId, player.id, sender_id, player.phone, status, message, createdAt);
        } catch (e) {}

        // Sync log to Firestore
        if (firestore) {
          try {
            await firestore.collection('billing_logs').doc(logId).set({
              id: logId, player_id: player.id, sender_id, phone: player.phone, status, message, created_at: createdAt
            });
          } catch (e) {}
        }
      }
    })().catch(console.error);
  });

  // Hibrid Sync Simulation (Legacy endpoint kept for compatibility)
  app.get('/api/hibrid/sync', async (req, res) => {
    if (!firestore) return res.status(503).json({ error: 'Database service unavailable' });
    try {
      const playersSnap = await firestore.collection('players').get();
      res.json({ 
        status: 'Synced with Firestore', 
        players_synced: playersSnap.size,
        sheets_url: 'https://docs.google.com/spreadsheets/d/your-id' 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // API Routes - Backup & Restore
  app.get('/api/backup/export', async (req, res) => {
    if (!firestore) return res.status(503).json({ error: 'Database service unavailable' });
    try {
      const collections = ['players', 'senders', 'attendance', 'fair_play', 'matches', 'app_settings', 'match_session', 'billing_logs', 'system_logs'];
      const backupData: any = { colecoes: {}, metadata: { data_backup: new Date().toISOString(), versao_sistema: '1.1.0-firebase' } };

      for (const colName of collections) {
        const snapshot = await firestore.collection(colName).get();
        backupData.colecoes[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      await addSystemLog('BACKUP_EXPORT', 'SYSTEM', 'backup', 'User exported a manual backup.');
      res.json(backupData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/backup/restore', async (req, res) => {
    if (!firestore) return res.status(503).json({ error: 'Database service unavailable' });
    const { backup, mode } = req.body; // mode: 'overwrite' | 'merge'
    if (!backup || !backup.colecoes) return res.status(400).json({ error: 'Formato de backup inválido' });

    try {
      console.log(`[RESTORE] Starting backup restoration in mode: ${mode}`);
      const collections = Object.keys(backup.colecoes);

      for (const colName of collections) {
        const docsData = backup.colecoes[colName];
        const batchSize = 500;
        
        for (let i = 0; i < docsData.length; i += batchSize) {
          const batch = firestore.batch();
          const chunk = docsData.slice(i, i + batchSize);
          
          for (const item of chunk) {
            const docId = item.id || uuidv4();
            const docRef = firestore.collection(colName).doc(docId);
            
            // For both modes, we overwrite if ID exists, or create new.
            // Full collection clear is omitted for safety and performance in this context.
            batch.set(docRef, item);
          }
          await batch.commit();
        }
      }

      await addSystemLog('BACKUP_RESTORE', 'SYSTEM', 'restore', `User restored backup in ${mode} mode.`);
      res.json({ success: true, message: 'Restauração concluída com sucesso' });
    } catch (e: any) {
      console.error("[RESTORE] Failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Helper for 404
  app.get('/favicon.ico', (req, res) => res.status(204).end());

  // Global JSON Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[SERVER ERROR]', err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Ocorreu um erro interno no servidor',
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  });

  // Vite
  if (process.env.NODE_ENV !== 'production') {
    console.log("[BOOT] Initializing Vite middleware...");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    console.log("[BOOT] Vite middleware initialized.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  if (!process.env.VERCEL) {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[BOOT] Server successfully started on port ${PORT}`);
      console.log(`[BOOT] Environment: ${process.env.NODE_ENV}`);
    });
  }

  return { app, httpServer };
}

const serverInit = startServer().catch(err => {
  console.error("[FATAL] startServer crashed during init:", err);
});

export { startServer, serverInit };
