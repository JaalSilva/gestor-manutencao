/// <reference types="vite/client" />
/**
 * BABA FINANCE & BILLING - FRONTEND CORE
 * Developed by: Jaal Silva
 * 
 * Advanced React interface for managing athlete data,
 * match sessions, and financial reporting.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserPlus, Send, RefreshCw, Trash2, CheckCircle2, AlertCircle, Phone, Database, 
  Smartphone, ShieldCheck, History, Settings, ExternalLink, Trophy, Users, Calendar, 
  Wallet, Star, Ghost, Award, FileSpreadsheet, Share2, Play, Pause, RotateCcw, Volume2, Timer,
  Download, Upload, HardDrive, FileJson, Info, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

import { io } from 'socket.io-client';

// --- Types ---
interface Player {
  id: string;
  name: string;
  phone: string;
  congregation?: string;
  age?: number;
  status_payment: 'PAGO' | 'PENDENTE';
  updated_at: string;
}

interface DraftPlayer {
  id: string;
  name: string;
  number: number; // 1 to 6
}

interface Sender {
  id: string;
  name: string;
  phone: string;
  status: 'CONECTADO' | 'DESCONECTADO';
}

interface RankingItem {
  name: string;
  phone: string;
  total_score: number;
}

interface AttendanceLog {
  id: string;
  player_name: string;
  date: string;
  status: string;
}

interface MatchSession {
  duration_remaining: number;
  is_running: number;
  start_time: string | null;
  team_a?: DraftPlayer[];
  team_b?: DraftPlayer[];
  current_gk_index_a?: number;
  current_gk_index_b?: number;
  is_extra_time?: boolean;
  matches_count_session?: number;
  total_elapsed_seconds?: number;
}

interface MatchRecord {
  id: string;
  date: string;
  team_a_score: number;
  team_b_score: number;
  notes: string;
}

interface MonthlyStats {
  topScorers: { name: string; goals: number }[];
  mostFouls: { name: string; fouls: number }[];
  fairPlayRanking: { name: string; total_score: number }[];
  matches: MatchRecord[];
}

// --- Translations ---
const translations = {
  pt: {
    dashboard: "Painel",
    partida: "Partida",
    jogadores: "Jogadores",
    financeiro: "Financeiro",
    fairplay: "Fair Play",
    estatisticas: "Estatísticas",
    novaPartida: "Nova Partida",
    iniciarPartida: "Iniciar Partida",
    primeiraPartida: "Primeira partida do dia?",
    sorteio: "Sorteio Eletrônico",
    selecionarAtletas: "Selecione 12 Atletas",
    atletaManual: "Atleta Avulso (Nome)",
    adicionar: "Adicionar",
    limpar: "Limpar",
    confirmarSorteio: "Realizar Sorteio",
    goleiro: "Goleiro",
    timeA: "Time A",
    timeB: "Time B",
    registrarGol: "Registrar Gol",
    registrarFalta: "Registrar Falta",
    acrescimo: "Acréscimo (+2min)",
    fimDeJogo: "Fim de Jogo!",
    chegueiPrimeiro: "Cheguei Primeiro",
    limparSorteio: "Limpar Seleção",
    configuracoes: "Configurações",
    idioma: "Idioma",
    salvar: "Salvar",
    editarAtleta: "Editar Atleta",
    atleta: "Atleta",
    pontos: "PTS",
    statusCampinho: "Status Campinho",
    emAndamento: "Em Andamento",
    aguardando: "Aguardando",
    jogosHoje: "Partidas Hoje",
    escritorio: "Escritório Amigos da Bola ⚽",
    contratar: "Contratar Atleta",
    pagamento: "Financeiro",
    saldo: "Saldo Amigos da Bola ⚽",
    emAberto: "Em Aberto",
    rankingTemporada: "Destaques da Temporada",
    verRanking: "Ver Ranking Completo",
    dica: "Dica do Especialista",
    apenasFalta: "Apenas Falta",
    amarelo: "Amarelo",
    azul: "Azul",
    vermelho: "Vermelho",
    avisoDica: "O Fair Play vale mais que o gol no Amigos da Bola ⚽. Mantenha os pagamentos em dia e a disciplina em campo para subir no ranking."
  },
  en: {
    dashboard: "Dashboard",
    partida: "Match",
    jogadores: "Players",
    financeiro: "Financial",
    fairplay: "Fair Play",
    estatisticas: "Stats",
    novaPartida: "New Match",
    iniciarPartida: "Start Match",
    primeiraPartida: "First match of the day?",
    sorteio: "Electronic Draw",
    selecionarAtletas: "Select 12 Athletes",
    atletaManual: "Guest Athlete (Name)",
    adicionar: "Add",
    limpar: "Clear",
    confirmarSorteio: "Draw Teams",
    goleiro: "Goalkeeper",
    timeA: "Team A",
    timeB: "Team B",
    registrarGol: "Register Goal",
    registrarFalta: "Register Foul",
    acrescimo: "Extra Time (+2min)",
    fimDeJogo: "Game Over!",
    chegueiPrimeiro: "I'm Here First",
    limparSorteio: "Clear Selection",
    configuracoes: "Settings",
    idioma: "Language",
    salvar: "Save",
    editarAtleta: "Edit Player",
    atleta: "Athlete",
    pontos: "PTS",
    statusCampinho: "Pitch Status",
    emAndamento: "In Progress",
    aguardando: "Waiting",
    jogosHoje: "Matches Today",
    escritorio: "Amigos da Bola ⚽ Office",
    contratar: "Hire Player",
    pagamento: "Financial",
    saldo: "Amigos da Bola ⚽ Balance",
    emAberto: "Pending",
    rankingTemporada: "Season Highlights",
    verRanking: "View Full Ranking",
    dica: "Expert Tip",
    apenasFalta: "Foul Only",
    amarelo: "Yellow",
    azul: "Blue",
    vermelho: "Red",
    avisoDica: "Fair Play is worth more than the goal in our baba. Keep payments up up-to-date and discipline on the field to rise in the ranking."
  }
};

// --- Constants ---
const atletasIniciais = [
  "Jaal Silva", "Eduardo Santos", "Leandro SPTO", "Ruan Luz", "Ed Willian", 
  "Alexandre BIgode", "André", "Ben-Hur", "Bira", "Caio", "César", 
  "Danilo", "Domingos", "Elias", "Fagner", "Flavio", "Isaac", "Islan", 
  "Jasdon", "Jonata", "Jonathan", "Josemiro", "Leandro Cortes", "Lourival", 
  "Mateus", "Mauricio", "Miguel", "Ruan Nicolas", "Samuel", "Thiago", 
  "Vitor", "Willian", "David Amaral", "Marcio", "Max", "Panda", "Givago", 
  "Felipe", "Luan", "Pedro", "Gustavo", "Igor", "Léo", "Dudu", "Neto", 
  "Tico", "Meco", "Lula", "Bolsonaro", "Ciro", "Moro", "Jaaziel Silva", 
  "Jean", "Carlos Alberto", "Geniselmo", "Vitor", "Thiago Gonzaga", "Matias"
];

// --- Main Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'partida' | 'jogadores' | 'financeiro' | 'fairplay' | 'estatisticas'>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', phone: '', congregation: '', age: '' });
  const [selectedSender, setSelectedSender] = useState<string>('');
  const [settings, setSettings] = useState({
    baba_name: 'Amigos da Bola ⚽',
    primary_color: '#FF5C00',
    secondary_color: '#1D1D1F',
    sync_timer: false,
    resenha_balance: '0',
    language: 'pt' as 'pt' | 'en',
    spreadsheet_id: '',
    google_client_id: '',
    make_webhook_url: ''
  });
  
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const handleSheetsSync = async () => {
    if (!settings.spreadsheet_id) {
      toast.error('Informe o ID da Planilha nas configurações');
      setIsSettingsOpen(true);
      return;
    }

    setLoading(true);
    try {
      console.log('--- DEBUG GOOGLE AUTH ---');
      console.log('Client ID being used:', settings.google_client_id);
      console.log('Spreadsheet ID:', settings.spreadsheet_id);
      
      if (!settings.google_client_id) {
        toast.error('Informe o Client ID do Google Cloud no painel de Configurações');
        setIsSettingsOpen(true);
        setLoading(false);
        return;
      }

      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: settings.google_client_id,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.access_token) {
            setGoogleAccessToken(response.access_token);
            try {
              toast.loading('Sincronizando Sistema Completo com Google Sheets...', { id: 'sheets-sync' });
              
              // 1. Members Data
              const membersData = players.map(p => [p.id, p.name, p.phone, p.congregation || '', p.age || '', p.status_payment, p.updated_at]);
              membersData.unshift(['ID', 'NOME', 'WHATSAPP', 'CONGREGAÇÃO', 'IDADE', 'PAGAMENTO', 'ULTIMA ATUALIZAÇÃO']);

              // 2. Attendance Data
              const attData = attendanceLogs.map(a => [a.id, a.player_name, a.date, a.status]);
              attData.unshift(['ID', 'JOGADOR', 'DATA', 'STATUS']);

              // 3. Fair Play Ranking Data
              const fpData = ranking.map(r => [r.id, r.name, r.score, r.foulCount, r.yellowCards, r.blueCards, r.redCards]);
              fpData.unshift(['ID', 'NOME', 'SCORE TOTAL', 'FALTAS', 'AMARELO', 'AZUL', 'VERMELHO']);

              // 4. Matches Data
              const matchData = (monthlyStats?.matches || []).map(m => [m.id, m.date, m.team_a_score, m.team_b_score, m.notes]);
              matchData.unshift(['ID', 'DATA', 'PLACAR A', 'PLACAR B', 'OBSERVAÇÕES']);

              const syncTab = async (tabName: string, data: any[][]) => {
                const range = `${tabName}!A1:Z${data.length + 10}`;
                let res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheet_id}/values/${range}?valueInputOption=USER_ENTERED`, {
                  method: 'PUT',
                  headers: { Authorization: `Bearer ${response.access_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ values: data })
                });

                if (res.status === 404) {
                   // Sheet might not exist, we'd need to create it, but for now we fallback to standard sync if it fails
                   console.warn(`Tab ${tabName} not found or accessible.`);
                }
                return res;
              };

              await syncTab('Membros', membersData);
              await syncTab('Presença', attData);
              await syncTab('Ranking', fpData);
              await syncTab('Partidas', matchData);

              toast.success('Sistema Sincronizado com Sucesso!', { id: 'sheets-sync' });
            } catch (e: any) {
              console.error(e);
              toast.error('Falha no sincronismo: ' + e.message, { id: 'sheets-sync' });
            } finally {
              setLoading(false);
            }
          } else {
            setLoading(false);
            toast.error('Falha na autenticação');
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error(e);
      setLoading(false);
      toast.error('Erro ao iniciar fluxo Google');
    }
  };
  
  // Match & Timer State
  const [matchSession, setMatchSession] = useState<MatchSession>({ duration_remaining: 600, is_running: 0, start_time: null, is_extra_time: false });
  const matchSessionRef = useRef(matchSession);
  useEffect(() => { matchSessionRef.current = matchSession; }, [matchSession]);
  const [displaySeconds, setDisplaySeconds] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditPlayerOpen, setIsEditPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirstMatchPromptOpen, setIsFirstMatchPromptOpen] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{cloud_accessible: boolean, cloud_sync_enabled: boolean, is_ephemeral: boolean} | null>(null);
  const [foulPlayer, setFoulPlayer] = useState<Player | null>(null);
  const [isFoulOpen, setIsFoulOpen] = useState(false);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const [manualName, setManualName] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentPlayer, setPaymentPlayer] = useState<Player | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [localSyncEnabled, setLocalSyncEnabled] = useState(true);

  const matchesToday = monthlyStats?.matches?.filter(m => m.date === new Date().toISOString().split('T')[0]).length || 0;

  const t = useCallback((key: keyof typeof translations['pt']) => {
    return (translations[settings.language] || translations['pt'])[key as any] || key;
  }, [settings.language]);

  // --- Data Fetching ---
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch players', e);
      toast.error('Erro ao buscar atletas. Verifique a conexão.');
      setPlayers([]);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.baba_name) {
        setSettings(prev => ({
          ...prev,
          ...data,
          sync_timer: data.sync_timer === 'true' || data.sync_timer === true
        }));
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  }, []);

  const fetchRanking = useCallback(async () => {
    try {
      const res = await fetch('/api/fairplay/ranking');
      const data = await res.json();
      setRanking(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch ranking', e);
      setRanking([]);
    }
  }, []);

  const fetchMonthlyStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/monthly');
      const data = await res.json();
      setMonthlyStats(data || { topScorers: [], mostFouls: [], fairPlayRanking: [], matches: [] });
    } catch (e) {
      console.error('Failed to fetch monthly stats', e);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      setAttendanceLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch attendance', e);
      setAttendanceLogs([]);
    }
  }, []);

  const fetchSenders = useCallback(async () => {
    try {
      const res = await fetch('/api/senders');
      const data = await res.json();
      const sendersList = Array.isArray(data) ? data : [];
      setSenders(sendersList);
      if (sendersList.length > 0 && !selectedSender) setSelectedSender(sendersList[0].id);
    } catch (e) {
      console.error('Failed to fetch senders', e);
      setSenders([]);
    }
  }, [selectedSender]);

  const fetchTimer = useCallback(async (forceSync = false) => {
    try {
      const res = await fetch('/api/match/timer');
      const data = await res.json();
      setMatchSession(data);
      // Sync display if status changed significantly, initial load, or forced
      if (forceSync || !data.is_running || Math.abs(displaySeconds - data.duration_remaining) > 10) {
        setDisplaySeconds(data.duration_remaining);
      }
    } catch (e) {
      console.error('Failed to fetch timer', e);
    }
  }, []); // Remove displaySeconds dependency to avoid refresh loop

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPlayers(),
        fetchSenders(),
        fetchRanking(),
        fetchAttendance(),
        fetchMonthlyStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchPlayers, fetchSenders, fetchRanking, fetchAttendance]);

  // Real-time Sync
  useEffect(() => {
    const socket = io();
    
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('data:updated', (event) => {
      if (!localSyncEnabled) return;
      console.log('Real-time update received:', event);
      switch(event.type) {
        case 'PLAYERS':
          fetchPlayers();
          break;
        case 'RANKING':
          fetchRanking();
          break;
        case 'SETTINGS':
          fetchSettings();
          break;
        case 'ATTENDANCE':
          fetchAttendance();
          break;
        case 'MATCHES':
          fetchMonthlyStats();
          break;
        case 'TIMER_CONTROL':
          if (settings.sync_timer) {
            setMatchSession(event.data);
            // Only force display sync if status changed or we are reset/paused
            if (!event.data.is_running || Math.abs(displaySeconds - event.data.duration_remaining) > 5) {
               setDisplaySeconds(event.data.duration_remaining);
            }
          }
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPlayers, fetchRanking, fetchSettings, fetchAttendance, settings.sync_timer]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        refreshData(),
        fetchSettings(),
        fetchTimer(true)
      ]);
      setLoading(false);
    };
    init();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // Only run on mount

  const handleTimerFinish = useCallback(() => {
    toast.error(t('fimDeJogo'), { icon: '⚽', duration: 10000 });
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);
      oscillator.stop(audioCtx.currentTime + 1.5);
      if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
    } catch(e) {}
  }, []);

  // Local countdown for smoothness
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (matchSession.is_running) {
      timerRef.current = setInterval(() => {
        setDisplaySeconds(prev => {
          if (prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            handleTimerFinish();
            return 0;
          }
          
          // Check for 5-minute mark increment
          // matchSessionRef.current.duration_remaining is the value when START was clicked
          // displaySeconds is the current countdown
          const currentDuration = prev - 1;
          return currentDuration;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [matchSession.is_running, handleTimerFinish]);

  // Handle Match Counting side-effect
  useEffect(() => {
    if (!matchSession.is_running) return;
    
    // Total played is what was already played in previous segments + what is played now
    const currentRunElapsed = matchSession.duration_remaining - displaySeconds;
    const totalPlayed = (matchSession.total_elapsed_seconds || 0) + currentRunElapsed;
    
    const expectedCount = Math.floor(totalPlayed / 300);
    const currentCount = matchSession.matches_count_session || 0;
    
    if (expectedCount > currentCount && expectedCount > 0) {
      handleTimerControl('INCREMENT_MATCH_COUNT');
    }
  }, [displaySeconds, matchSession.is_running, matchSession.duration_remaining, matchSession.matches_count_session, matchSession.total_elapsed_seconds]);

  const runDraft = () => {
    if (draftSelection.length !== 12) {
      toast.error(t('selecionarAtletas') + ' (12)');
      return;
    }
    
    // Enterprise Fisher-Yates Shuffle
    let shuffled = [...draftSelection];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Randomize initial goalkeepers (1 to 6)
    const initialGkIndexA = Math.floor(Math.random() * 6);
    const initialGkIndexB = Math.floor(Math.random() * 6);
    
    const teamAPlayers = shuffled.slice(0, 6).map((name, idx) => ({ id: crypto.randomUUID(), name, number: idx + 1 }));
    const teamBPlayers = shuffled.slice(6, 12).map((name, idx) => ({ id: crypto.randomUUID(), name, number: idx + 1 }));
    
    const newSession: MatchSession = {
      ...matchSession,
      team_a: teamAPlayers,
      team_b: teamBPlayers,
      current_gk_index_a: initialGkIndexA,
      current_gk_index_b: initialGkIndexB,
      duration_remaining: 600,
      is_running: 0,
      is_extra_time: false,
      start_time: null
    };
    
    setMatchSession(newSession);
    setDisplaySeconds(600);
    setIsDraftOpen(false);
    setDraftSelection([]);
    
    fetch('/api/match/timer/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SESSION', session: newSession }),
    });
    
    toast.success(t('sorteio') + ' Realizado!');
    setTimeout(() => {
      toast.info(`Time A [GK]: ${teamAPlayers[initialGkIndexA].name} (#${initialGkIndexA + 1})`, { icon: '🧤' });
    }, 500);
    setTimeout(() => {
      toast.info(`Time B [GK]: ${teamBPlayers[initialGkIndexB].name} (#${initialGkIndexB + 1})`, { icon: '🧤' });
    }, 1000);
  };

  const handleTimerControl = async (action: 'START' | 'PAUSE' | 'RESET' | 'EXTRA' | 'INCREMENT_MATCH_COUNT' | 'UPDATE', duration?: number) => {
    let body: any = { action };
    if (duration) body.duration = duration;
    
    if (action === 'EXTRA') {
      toast.success(t('acrescimo'));
    }

    const res = await fetch('/api/match/timer/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMatchSession(data);
    setDisplaySeconds(data.duration_remaining);
    
    if (action === 'START') toast.success('Cronômetro Iniciado');
    if (action === 'PAUSE') toast.info('Partida Pausada');
    if (action === 'RESET') toast.info('Cronômetro Reiniciado');
  };

  const fetchCloudStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sync-status');
      if (!res.ok) throw new Error('Status check failed');
      const data = await res.json();
      setCloudStatus(data);
      // Only set connected if both enabled and accessible
      setConnected(!!(data.cloud_sync_enabled && data.cloud_accessible));
    } catch (e) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchCloudStatus();
    const interval = setInterval(fetchCloudStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchCloudStatus]);

  const handleForceMigration = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/force-migration', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Sincronização com a nuvem iniciada!');
        fetchCloudStatus();
      } else {
        toast.error('Erro na sincronização: ' + data.error);
      }
    } catch (e: any) {
      toast.error('Falha na comunicação: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    setLoading(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings }),
    });
    setSettings(prev => ({ ...prev, ...newSettings }));
    setLoading(false);
    toast.success('Configurações salvas');
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.name) return toast.error('O nome é obrigatório');
    
    setLoading(true);
    console.log('[DEBUG] Attempting to hire:', newPlayer);
    
    try {
      const ageNum = newPlayer.age ? parseInt(newPlayer.age) : null;
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlayer,
          age: isNaN(ageNum as number) ? null : ageNum
        }),
      });
      
      let savedPlayer;
      const textResponse = await res.text();
      
      try {
        savedPlayer = JSON.parse(textResponse);
      } catch (e) {
        console.warn('[WARN] Resposta não é JSON:', textResponse);
        if (!res.ok) {
           throw new Error('Erro no servidor: ' + (textResponse.substring(0, 100) || 'Resposta vazia'));
        }
        savedPlayer = { name: newPlayer.name }; 
      }
      
      if (!res.ok) {
        throw new Error(savedPlayer.error || savedPlayer.message || 'Erro ao adicionar atleta');
      }
      
      console.log('[DEBUG] Player saved:', savedPlayer);
      
      // --- Trigger Make Webhook if configured ---
      if (settings.make_webhook_url) {
        console.log('[DEBUG] Triggering Make Webhook...');
        try {
          fetch(settings.make_webhook_url, {
            method: 'POST',
            mode: 'no-cors', // Many webhooks don't return CORS headers
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'NEW_PLAYER',
              athlete: savedPlayer,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.warn('[WARN] Webhook trigger non-critical error:', err));
        } catch (webhookErr) {
          console.warn('[WARN] Webhook failed:', webhookErr);
        }
      }
      
      toast.success('Atleta adicionado com sucesso');
      setIsAddOpen(false);
      setNewPlayer({ name: '', phone: '', congregation: '', age: '' });
      fetchPlayers();
    } catch (e: any) {
      console.error('[ERRO] Falha na contratação:', e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = async () => {
    if (!editingPlayer) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editingPlayer.name, 
          phone: editingPlayer.phone,
          congregation: editingPlayer.congregation,
          age: editingPlayer.age
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erro ao atualizar atleta');
      }

      toast.success('Atleta atualizado');
      setIsEditPlayerOpen(false);
      fetchPlayers();
    } catch (e: any) {
      console.error('[ERRO] Falha na edição:', e);
      toast.error(e.message || 'Erro ao atualizar atleta');
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = async (player: Player) => {
    if (player.status_payment === 'PAGO') {
      const newStatus = 'PENDENTE';
      await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_payment: newStatus }),
      });
      toast.info(`Status de ${player.name} alterado para Pendente`);
      fetchPlayers();
      fetchRanking();
    } else {
      setPaymentPlayer(player);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setIsPaymentOpen(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentPlayer) return;
    setLoading(true);
    try {
      await fetch(`/api/players/${paymentPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status_payment: 'PAGO', 
          payment_date: paymentDate 
        }),
      });
      toast.success(`Pagamento de ${paymentPlayer.name} confirmado!`);
      setIsPaymentOpen(false);
      setPaymentPlayer(null);
      fetchPlayers();
      fetchRanking();
      fetchMonthlyStats();
    } catch (e) {
      toast.error('Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAttendance = async (status: string) => {
    if (!selectedPlayerId) return;
    const date = new Date().toISOString().split('T')[0];
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: selectedPlayerId, date, status }),
    });
    toast.success('Presença registrada');
    setIsAttendanceOpen(false);
    fetchAttendance();
    fetchRanking();
  };

  const handleFairPlayEvent = async (playerId: string, category: string, score: number, reason: string) => {
    setLoading(true);
    try {
      await fetch('/api/fairplay/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, category, score, reason }),
      });

      // Goalkeeper rotation logic if goal
      if (category === 'GOL') {
         // Determine which team scored and rotate the OTHER team's GK
         // For simplicity, we check which team the player belongs to (if teams are active)
         if (matchSession.team_a && matchSession.team_b) {
            const isTeamA = matchSession.team_a.some(p => p.id === playerId || p.name === players.find(pl => pl.id === playerId)?.name);
            let updatedSession = { ...matchSession };
            if (isTeamA) {
               // Team A scored, rotate Team B goalkeeper
               updatedSession.current_gk_index_b = ((matchSession.current_gk_index_b || 0) + 1) % 6;
            } else {
               // Team B scored, rotate Team A goalkeeper
               updatedSession.current_gk_index_a = ((matchSession.current_gk_index_a || 0) + 1) % 6;
            }
            
            setMatchSession(updatedSession);
            fetch('/api/match/timer/control', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'UPDATE_SESSION', session: updatedSession }),
            });
            toast.info(t('goleiro') + ' ' + (isTeamA ? t('timeB') : t('timeA')) + ' ' + (isTeamA ? updatedSession.team_b![updatedSession.current_gk_index_b!].name : updatedSession.team_a![updatedSession.current_gk_index_a!].name));
         }
      }

      toast.success('Pontuação atualizada');
      setIsEventOpen(false);
      fetchRanking();
      fetchMonthlyStats(); // Update stats dashboard immediately
    } finally {
      setLoading(false);
    }
  };

  const handleChargeLate = async () => {
    if (!selectedSender) return toast.error('Selecione um remetente');
    setLoading(true);
    try {
      const res = await fetch('/api/charge-late', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: selectedSender }),
      });
      const data = await res.json();
      toast.info(data.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateReport = () => {
    const doc = new jsPDF();
    const primaryColor = settings.primary_color || '#FF5C00';
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(`RELATÓRIO: ${settings.baba_name.toUpperCase()}`, 15, 25);
    doc.setFontSize(10);
    doc.text(`GERADO EM: ${new Date().toLocaleDateString()}`, 150, 25);

    // Financial Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("RESUMO FINANCEIRO", 15, 55);
    
    const paidPlayers = players?.filter(p => p.status_payment === 'PAGO') || [];
    const pendingPlayers = players?.filter(p => p.status_payment === 'PENDENTE') || [];
    
    autoTable(doc, {
      startY: 65,
      head: [['Categoria', 'Quantidade', 'Valor Total']],
      body: [
        ['Pagos', paidPlayers.length, `R$ ${paidPlayers.length * 40}`],
        ['Pendentes', pendingPlayers.length, `R$ ${pendingPlayers.length * 40}`],
        ['Total Esperado', players.length, `R$ ${players.length * 40}`]
      ],
      headStyles: { fillColor: primaryColor as any }
    });

    // Fair Play Section
    doc.setFontSize(18);
    doc.text("RANKING FAIR PLAY", 15, (doc as any).lastAutoTable.finalY + 20);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 30,
      head: [['Pos', 'Atleta', 'Pontuação']],
      body: ranking.map((item, idx) => [
        `${idx + 1}º`,
        item.name,
        `${item.total_score} pts`
      ]),
      headStyles: { fillColor: primaryColor as any }
    });

    doc.save(`relatorio_${settings.baba_name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    toast.success('Relatório gerado com sucesso!');
  };

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backup/export');
      if (!response.ok) throw new Error('Falha no servidor');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_baba_firestore_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success('Backup do Firestore exportado com sucesso!');
    } catch (e: any) {
      toast.error('Erro ao exportar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'overwrite' | 'merge') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(`Você tem certeza que deseja restaurar os dados no modo: ${mode.toUpperCase()}?`)) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const backup = JSON.parse(e.target?.result as string);
        const response = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup, mode }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(`Importação realizada: ${result.message}`);
          setTimeout(() => window.location.reload(), 2000);
        } else {
          toast.error(result.error || 'Falha na restauração');
        }
      } catch (err) {
        toast.error('Arquivo de backup corrompido ou inválido');
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const navItemClass = (id: string) => `
    flex items-center gap-2 px-6 py-4 border-b-2 transition-all cursor-pointer uppercase text-[10px] font-black tracking-widest
    ${activeTab === id ? 'border-orange-600 text-orange-600 bg-orange-50/30' : 'border-transparent text-zinc-400 hover:text-zinc-600'}
  `;

  return (
    <div className="min-h-screen bg-[#E5E7EB] text-[#1D1D1F] font-sans selection:bg-orange-100 pb-20" style={{ '--primary': settings.primary_color } as any}>
      <Toaster position="top-right" richColors />
      
      {/* Top Navigation - Cartola Style */}
      <nav className="sticky top-0 z-50 shadow-lg" style={{ backgroundColor: settings.primary_color }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 h-16">
          <div className="flex items-center gap-3">
            <Trophy className="text-white drop-shadow-md" size={32} />
            <div className="flex flex-col leading-none">
              <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Amigos da Bola ⚽</h1>
              <span className="text-[10px] font-bold tracking-[0.1em] opacity-80 uppercase text-white">Próximo Jogo</span>
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex gap-1">
               {['dashboard', 'partida', 'jogadores', 'financeiro', 'fairplay', 'estatisticas'].map((tab) => (
                 <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 uppercase text-[10px] font-black tracking-widest transition-all rounded hover:bg-white/10 ${activeTab === tab ? 'bg-white' : 'text-white'}`}
                  style={{ color: activeTab === tab ? settings.primary_color : 'white' }}
                 >
                   {tab === 'estatisticas' ? 'Estatísticas' : tab}
                 </button>
               ))}
            </div>
          </div>
          <div className="flex gap-2 items-center">
             <div className="hidden lg:flex flex-col items-end text-white">
               <span className="text-[8px] font-bold opacity-70 uppercase text-white">Cofre Amigos da Bola ⚽</span>
               <span className="text-sm font-black italic text-white">R$ {players?.filter(p => p.status_payment === 'PAGO').length * 40}</span>
             </div>
             <button 
                onClick={() => {
                  const nextState = !localSyncEnabled;
                  setLocalSyncEnabled(nextState);
                  if (nextState) {
                    refreshData();
                    fetchTimer();
                    toast.info('Sincronismo ativado e dados atualizados');
                  } else {
                    toast.info('Sincronismo desativado neste aparelho');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${localSyncEnabled && connected ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-rose-500/20 border-rose-500/50'}`}
             >
                <div className={`w-2 h-2 rounded-full ${localSyncEnabled && connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-black uppercase text-white tracking-widest">
                  {localSyncEnabled && connected ? 'Ao Vivo' : 'Offline'}
                </span>
             </button>
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsSettingsOpen(true)}><Settings size={20}/></Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <AnimatePresence mode="wait">
          
          {/* TAB: DASHBOARD (ESCALAÇÃO ESTILO CARTOLA) */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 relative">
               
               {players.length < 40 && (
                 <motion.div 
                   animate={{ opacity: [1, 0.4, 1] }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   onClick={() => setIsAddOpen(true)}
                   className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 cursor-pointer bg-white/90 backdrop-blur px-4 py-1.5 rounded-full border border-orange-200 shadow-sm flex items-center gap-2 whitespace-nowrap"
                 >
                   <UserPlus size={14} className="text-orange-600" />
                   <span className="text-[10px] font-black uppercase italic text-orange-600 tracking-wider">Temporada aberta, contrate</span>
                 </motion.div>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 
                 {/* Ranking TOP 3 */}
                 <div className="lg:col-span-8 space-y-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-xl font-black uppercase italic tracking-tight border-l-4 pl-3" style={{ borderColor: settings.primary_color }}>Destaques da Temporada</h2>
                     <Button variant="link" className="text-[10px] uppercase font-bold" style={{ color: settings.primary_color }} onClick={() => setActiveTab('fairplay')}>Ver Ranking Completo</Button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {ranking.slice(0, 3).map((player, idx) => (
                       <Card key={idx} className="rounded-xl border-none shadow-sm bg-white overflow-hidden relative group">
                         <div className={`absolute top-0 left-0 w-full h-1 ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-zinc-300' : 'bg-orange-400'}`} />
                         <CardContent className="p-6 space-y-4">
                           <div className="flex justify-between items-start">
                             <div className="h-14 w-14 rounded-full bg-zinc-100 border-2 border-zinc-50 flex items-center justify-center text-xl font-black text-zinc-400 italic">
                               {player.name[0]}
                             </div>
                             <Badge className="bg-zinc-100 text-zinc-600 shadow-none border-none text-[10px] font-black">{player.total_score} PTS</Badge>
                           </div>
                           <div>
                             <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: settings.primary_color }}>{idx + 1}º Colocado</p>
                             <h3 className="text-lg font-black uppercase italic truncate">{player.name}</h3>
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>

                   {/* Quick Field View */}
                   <div className="bg-[#1D1D1F] rounded-2xl p-8 text-white relative overflow-hidden min-h-[300px] flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10 flex flex-col items-center justify-center">
                         <div className="border border-white/20 w-full h-[1px] my-auto" />
                         <div className="border border-white/20 rounded-full w-40 h-40 absolute" />
                      </div>
                      <div className="relative z-10 text-center space-y-4">
                         <Users size={48} className="mx-auto text-orange-500 opacity-50" />
                         <h3 className="text-2xl font-black uppercase italic">Jogadores em Campo</h3>
                         <p className="text-zinc-400 text-xs uppercase font-bold tracking-widest max-w-sm mx-auto">Configure os times semanalmente e acompanhe as estatísticas em tempo real.</p>
                         <Button className="rounded-full uppercase font-black text-xs px-8 h-12 text-white" style={{ backgroundColor: settings.primary_color }} onClick={() => setActiveTab('partida')}>Iniciar Nova Partida</Button>
                      </div>
                   </div>
                 </div>

                 {/* Side Finance Control */}
                 <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-2xl border-none bg-white p-6 space-y-6 shadow-sm">
                       <div className="flex justify-between items-center">
                          <h3 className="text-sm font-black uppercase italic">Caixa Atual</h3>
                          <Wallet className="text-zinc-200" size={20} />
                       </div>
                       <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Arrecadação</span>
                          <div className="text-4xl font-black italic" style={{ color: settings.primary_color }}>
  R$ {Math.min(players?.filter(p => p.status_payment === 'PAGO').length * 40 || 0, 1000)}
</div>
{players?.filter(p => p.status_payment === 'PAGO').length * 40 > 1000 && (
  <div className="text-[10px] font-black text-green-600 animate-pulse">
    + R$ {players?.filter(p => p.status_payment === 'PAGO').length * 40 - 1000} NO RESENHA
  </div>
)}
{parseFloat(settings.resenha_balance || '0') + Math.max(0, players?.filter(p => p.status_payment === 'PAGO').length * 40 - 1000) >= 1500 && (
  <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 mt-4 flex items-center gap-2">
    <div className="bg-orange-600 text-white p-1.5 rounded-lg text-sm">🥩</div>
    <div className="flex-1">
      <p className="text-[8px] font-black uppercase text-orange-900 leading-none">Churrasco Ativado!</p>
    </div>
  </div>
)}
                       </div>
                       <div className="pt-6 border-t border-zinc-100 space-y-4">
                          <div className="flex justify-between text-xs">
                             <span className="font-bold text-zinc-400">AMICI DI BOLA</span>
                             <span className="font-black text-zinc-900">{players.length} ATLETAS</span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="font-bold text-zinc-400">SALDO RESENHA</span>
                             <span className="font-black text-blue-600">
                               R$ {(parseFloat(settings.resenha_balance || '0') + Math.max(0, players?.filter(p => p.status_payment === 'PAGO').length * 40 - 1000)).toFixed(2)}
                             </span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="font-bold text-zinc-400">PENDENTES</span>
                             <span className="font-black text-red-500">{players?.filter(p => p.status_payment === 'PENDENTE').length}</span>
                          </div>
                          <Button className="w-full bg-[#1D1D1F] hover:bg-black rounded-xl h-12 uppercase font-black text-[10px] tracking-widest text-white" onClick={handleChargeLate}>
                             <Send className="mr-2 h-4 w-4" /> Cobrar Atrasos via WHATS
                          </Button>
                          <Button variant="outline" className="w-full border-2 rounded-xl h-12 uppercase font-black text-[10px] tracking-widest" style={{ borderColor: settings.primary_color, color: settings.primary_color }} onClick={generateReport}>
                             <FileSpreadsheet className="mr-2 h-4 w-4" /> Relatório Geral (PDF)
                          </Button>
                       </div>
                    </Card>

                    <Card className="rounded-2xl border-none bg-orange-600 p-6 text-white shadow-lg space-y-4">
                       <Star className="text-orange-200" />
                       <h3 className="font-black uppercase italic text-lg leading-tight">{t('dica')}</h3>
                       <p className="text-xs font-medium opacity-80 leading-relaxed italic">"{t('avisoDica')}"</p>
                    </Card>
                  </div>
               </div>
            </motion.div>
          )}

          {/* TAB: MODO PARTIDA (CORE FEATURE) */}
          {activeTab === 'partida' && (
            <motion.div key="partida" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 flex flex-col items-center py-10 w-full overflow-hidden">
               
               {matchSession.team_a && matchSession.team_a.length > 0 && (
                  <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                     {/* Team A */}
                     <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white border border-zinc-100">
                        <div className="bg-[#1D1D1F] p-5 text-center">
                           <h3 className="text-xl font-black uppercase italic text-white tracking-widest">{t('timeA')}</h3>
                        </div>
                        <div className="p-6 space-y-3">
                           {matchSession.team_a.map((p, idx) => (
                              <div key={p.name + idx} className={`flex justify-between items-center p-4 rounded-2xl border-l-4 transition-all ${matchSession.current_gk_index_a === idx ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-zinc-50 border-zinc-200'}`}>
                                 <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black italic ${matchSession.current_gk_index_a === idx ? 'bg-orange-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                                      {p.number}
                                    </div>
                                    <span className="font-black uppercase text-zinc-800 tracking-tight">{p.name}</span>
                                 </div>
                                 {matchSession.current_gk_index_a === idx && <Badge className="bg-orange-600 text-[10px] font-black uppercase italic px-3 py-1">{t('goleiro')}</Badge>}
                              </div>
                           ))}
                        </div>
                     </Card>

                     {/* Team B */}
                     <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white border border-zinc-100">
                        <div className="bg-orange-600 p-5 text-center">
                           <h3 className="text-xl font-black uppercase italic text-white tracking-widest">{t('timeB')}</h3>
                        </div>
                        <div className="p-6 space-y-3">
                           {matchSession.team_b?.map((p, idx) => (
                              <div key={p.name + idx} className={`flex justify-between items-center p-4 rounded-2xl border-l-4 transition-all ${matchSession.current_gk_index_b === idx ? 'bg-zinc-900 border-zinc-900 shadow-sm text-white' : 'bg-zinc-50 border-zinc-200'}`}>
                                 <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black italic ${matchSession.current_gk_index_b === idx ? 'bg-white text-zinc-900' : 'bg-zinc-200 text-zinc-500'}`}>
                                      {p.number}
                                    </div>
                                    <span className={`font-black uppercase tracking-tight ${matchSession.current_gk_index_b === idx ? 'text-white' : 'text-zinc-800'}`}>{p.name}</span>
                                 </div>
                                 {matchSession.current_gk_index_b === idx && <Badge className="bg-white text-zinc-900 text-[10px] font-black uppercase italic px-3 py-1 border-none">{t('goleiro')}</Badge>}
                              </div>
                           ))}
                        </div>
                     </Card>
                  </div>
               )}

               <div className="text-center space-y-6 w-full max-w-2xl bg-white rounded-3xl p-10 shadow-2xl border-4 border-[#1D1D1F]">
                  <div className="flex items-center justify-center gap-4 text-zinc-400">
                     <Timer size={24} />
                     <span className="text-sm font-black uppercase tracking-[0.3em]">Match Timer v2.0</span>
                  </div>

                  <div className={`text-6xl md:text-8xl font-black italic leading-none tracking-tighter select-none font-mono py-6 ${displaySeconds < 60 ? 'text-red-600 animate-pulse' : 'text-[#1D1D1F]'}`}>
                    {matchSession.is_extra_time && <span className="block text-2xl text-red-600 uppercase font-black mb-2 animate-bounce">{t('acrescimo')}</span>}
                    {formatTime(displaySeconds)}
                  </div>

                  {!matchSession.is_running && (
                    <div className="flex justify-center gap-2 mb-6">
                      {[5, 10, 12, 15].map(m => (
                        <Button 
                          key={m} 
                          variant={displaySeconds === m * 60 ? "default" : "outline"}
                          className="h-10 px-4 rounded-xl font-bold"
                          onClick={() => {
                            setDisplaySeconds(m * 60);
                            handleTimerControl('UPDATE', m * 60);
                          }}
                        >
                          {m} Min
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-6">
                    {matchSession.is_running ? (
                      <Button onClick={() => handleTimerControl('PAUSE')} className="h-28 w-28 rounded-full bg-orange-600 hover:bg-orange-700 shadow-xl scale-125">
                        <Pause size={48} fill="currentColor" />
                      </Button>
                    ) : (
                      <Button onClick={() => {
                        if (displaySeconds === 600 && matchesToday === 0 && (!matchSession.team_a || matchSession.team_a.length === 0)) {
                           setIsFirstMatchPromptOpen(true);
                        } else if (displaySeconds === 0 && !matchSession.is_extra_time) {
                           // Show extra time option maybe?
                           handleTimerControl('EXTRA');
                        } else {
                           handleTimerControl('START');
                        }
                      }} className="h-28 w-28 rounded-full bg-green-600 hover:bg-green-700 shadow-xl scale-125">
                        <Play size={48} fill="currentColor" className="ml-2" />
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => handleTimerControl('RESET')} className="h-20 w-20 rounded-full border-4 border-zinc-200 text-zinc-400 hover:text-black hover:border-black transition-all">
                      <RotateCcw size={32} />
                    </Button>
                  </div>

                  {matchSession.is_running === 1 && (
                    <div className="flex justify-center gap-3 mt-6">
                      <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px]" onClick={() => handleTimerControl('EXTRA', 60)}>+1 Min</Button>
                      <Button variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px]" onClick={() => handleTimerControl('EXTRA', 120)}>+2 Min</Button>
                    </div>
                  )}

                  <div className="pt-12 grid grid-cols-2 gap-8 border-t border-zinc-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-zinc-400">{t('jogosHoje')}</p>
                      <p className="text-2xl font-black italic">{matchesToday} {matchesToday === 1 ? 'Jogo' : 'Jogos'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-zinc-400">Total Match Time</p>
                      <p className="text-2xl font-black italic">
                        {formatTime(
                          (matchSession.total_elapsed_seconds || 0) + 
                          (matchSession.is_running ? (matchSession.duration_remaining - displaySeconds) : 0)
                        )}
                      </p>
                    </div>
                  </div>
               </div>

               {/* Quick Action During Game */}
               <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-800 p-6 rounded-2xl flex items-center justify-between text-white border-2 border-transparent hover:border-orange-500 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-600 flex items-center justify-center font-black">⚽</div>
                        <span className="font-black uppercase italic">Registrar Gol</span>
                     </div>
                     <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
                       <DialogTrigger render={<Button variant="ghost" className="text-zinc-400 hover:text-white uppercase text-[10px] font-black">Adicionar</Button>} />
                       <DialogContent className="rounded-2xl border-none">
                         <DialogHeader><DialogTitle className="uppercase font-black italic">Quem marcou o gol?</DialogTitle></DialogHeader>
                         <div className="max-h-60 overflow-y-auto space-y-2 py-4 px-2">
                           {players.map(p => (
                             <Button key={p.id} variant="outline" className="w-full justify-start rounded-xl font-bold uppercase italic h-12" onClick={() => { handleFairPlayEvent(p.id, 'GOL', 1, `Gol na partida`); toast.success('GOL REGISTRADO!'); setIsGoalOpen(false); }}>{p.name}</Button>
                           ))}
                         </div>
                       </DialogContent>
                     </Dialog>
                  </div>
                  <div className="bg-zinc-800 p-6 rounded-2xl flex items-center justify-between text-white border-2 border-transparent hover:border-red-500 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center font-black">⚠️</div>
                        <span className="font-black uppercase italic">Registrar Falta</span>
                     </div>
                     <Dialog open={isFoulOpen} onOpenChange={(open) => { setIsFoulOpen(open); if(!open) setFoulPlayer(null); }}>
                       <DialogTrigger render={<Button variant="ghost" className="text-zinc-400 hover:text-white uppercase text-[10px] font-black">Punir</Button>} />
                       <DialogContent className="rounded-2xl border-none max-w-sm">
                          {!foulPlayer ? (
                            <>
                              <DialogHeader><DialogTitle className="uppercase font-black italic">Qual o infrator?</DialogTitle></DialogHeader>
                              <div className="max-h-60 overflow-y-auto space-y-2 py-4 px-2">
                                {players.map(p => (
                                  <Button key={p.id} variant="outline" className="w-full justify-start rounded-xl font-bold uppercase italic border-red-100 h-10" onClick={() => setFoulPlayer(p)}>{p.name}</Button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-6">
                              <DialogHeader>
                                <DialogTitle className="uppercase font-black italic text-center text-xl">Evento de Falta: {foulPlayer.name}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-1 gap-3">
                                 <Button className="h-14 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-black uppercase italic flex justify-between px-6" onClick={() => { handleFairPlayEvent(foulPlayer.id, 'ADVERTENCIA', 0, `Apenas Falta`); setIsFoulOpen(false); setFoulPlayer(null); }}>
                                   <span>Apenas Falta</span>
                                   <span className="opacity-70">0 Pts</span>
                                 </Button>
                                 <Button className="h-14 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase italic flex justify-between px-6" onClick={() => { handleFairPlayEvent(foulPlayer.id, 'ADVERTENCIA', -3, `Cartão Amarelo`); setIsFoulOpen(false); setFoulPlayer(null); }}>
                                   <span>Amarelo</span>
                                   <span className="opacity-70">-3 Pts</span>
                                 </Button>
                                 <Button className="h-14 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase italic flex justify-between px-6" onClick={() => { handleFairPlayEvent(foulPlayer.id, 'ADVERTENCIA', -5, `Cartão Azul`); setIsFoulOpen(false); setFoulPlayer(null); }}>
                                   <span>Azul</span>
                                   <span className="opacity-70">-5 Pts</span>
                                 </Button>
                                 <Button className="h-14 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase italic flex justify-between px-6" onClick={() => { handleFairPlayEvent(foulPlayer.id, 'ADVERTENCIA', -10, `Cartão Vermelho`); setIsFoulOpen(false); setFoulPlayer(null); }}>
                                   <span>Vermelho</span>
                                   <span className="opacity-70">-10 Pts</span>
                                 </Button>
                              </div>
                              <Button variant="ghost" className="w-full uppercase font-black text-[10px]" onClick={() => setFoulPlayer(null)}>Voltar</Button>
                            </div>
                          )}
                       </DialogContent>
                     </Dialog>
                  </div>
               </div>
            </motion.div>
          )}

          {/* TAB: JOGADORES */}
          {activeTab === 'jogadores' && (
            <motion.div key="jogadores" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
                  <h2 className="text-2xl font-black uppercase italic tracking-tight">Escritório Amigos da Bola ⚽</h2>
                  <div className="flex gap-3 items-center flex-wrap justify-end">
                    {players.length < 30 && (
                      <Button 
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-4 h-12 flex gap-2 font-black uppercase italic text-xs shadow-lg animate-bounce"
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await fetch('/api/admin/seed-athletes', { method: 'POST' });
                            const data = await res.json();
                            if (data.success) {
                              toast.success(`Sucesso! ${data.added} atletas sincronizados.`);
                              await fetchPlayers();
                            } else {
                              throw new Error(data.error);
                            }
                          } catch (e: any) {
                            toast.error('Erro na importação: ' + e.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        <Download size={14} />
                        Importar Lista Oficial (Base de Dados)
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="border-2 border-emerald-100 text-emerald-600 rounded-xl px-4 h-12 flex gap-2 font-black uppercase italic text-xs hover:bg-emerald-50"
                      onClick={handleSheetsSync}
                    >
                      <FileSpreadsheet size={16} />
                      Sync Sheets
                    </Button>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-[#FF5C00] font-black uppercase italic rounded-xl px-6 h-12 shadow-lg hover:bg-orange-700">Contratar Atleta</Button>
                  </div>
               </div>

               <AnimatePresence>
                 {draftSelection.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 overflow-hidden shadow-sm"
                   >
                     <div className="flex items-center gap-3">
                       <div className="bg-orange-600 text-white h-10 w-10 rounded-full flex items-center justify-center font-black italic shadow-inner">
                         {draftSelection.length}
                       </div>
                       <div>
                         <p className="text-[10px] font-black uppercase italic text-orange-900 leading-none">Jogadores Presentes</p>
                         <p className="text-[9px] font-bold text-orange-700 uppercase tracking-widest">{draftSelection.length}/12 selecionados para o sorteio</p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="font-black uppercase italic text-[10px] text-orange-700 hover:bg-orange-100"
                         onClick={() => setDraftSelection([])}
                       >
                         <Trash2 size={12} className="mr-1" /> {t('limparSorteio')}
                       </Button>
                       <Button 
                         size="sm" 
                         className="bg-orange-600 hover:bg-orange-700 text-white font-black uppercase italic text-[10px] rounded-xl px-6 h-10 shadow-md"
                         onClick={() => setIsDraftOpen(true)}
                       >
                         {draftSelection.length === 12 ? 'Ir para Sorteio ⚽' : 'Ver Lista'}
                       </Button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {players.map(p => (
                   <Card key={p.id} className="rounded-2xl border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all bg-white relative overflow-hidden group">
                     <div className={`absolute top-0 right-0 p-3 z-10 ${p.status_payment === 'PAGO' ? 'text-green-500' : 'text-red-500'}`}>
                        {p.status_payment === 'PAGO' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                     </div>
                     <CardContent className="p-6 text-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-zinc-100 mx-auto flex items-center justify-center text-3xl font-black text-zinc-300 italic group-hover:bg-orange-50 group-hover:text-orange-300 transition-colors">
                          {p.name[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-black uppercase italic truncate">{p.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{p.phone}</p>
                        </div>
                        <Button 
                           size="sm" 
                           className={`w-full font-black uppercase italic text-[10px] rounded-xl h-10 transition-all ${p.status_payment === 'PAGO' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'}`}
                           onClick={() => togglePayment(p)}
                        >
                           {p.status_payment === 'PAGO' ? 'Pagamento Efetuado' : 'Registrar Pagamento'}
                        </Button>
                        <div className="flex gap-2 justify-center pt-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg flex items-center gap-1 text-[9px] font-black uppercase italic" onClick={() => togglePayment(p)}>
                             <Wallet size={12}/> {p.status_payment === 'PAGO' ? 'Pago' : 'Pagar'}
                          </Button>
                          <Button variant="secondary" size="sm" className="h-8 px-3 rounded-lg flex items-center gap-1 text-[9px] font-black uppercase italic bg-zinc-100" onClick={() => { setEditingPlayer(p); setIsEditPlayerOpen(true); }}>
                             <Settings size={12}/> EDITAR
                          </Button>
                          <Button 
                            variant={draftSelection.includes(p.name) ? "default" : "outline"}
                            className={`h-10 px-3 rounded-xl flex items-center gap-2 transition-all ${draftSelection.includes(p.name) ? 'bg-orange-600 text-white border-none shadow-md' : 'text-zinc-400 border-zinc-200'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (draftSelection.includes(p.name)) {
                                setDraftSelection(draftSelection.filter(n => n !== p.name));
                              } else if (draftSelection.length < 12) {
                                setDraftSelection([...draftSelection, p.name]);
                                toast.success(`${p.name} chegou! (${draftSelection.length + 1}/12)`);
                              } else {
                                toast.info("Limite de 12 jogadores atingido!");
                              }
                            }}
                            title={t('chegueiPrimeiro')}
                          >
                            <UserCheck size={14}/>
                            <span className="text-[9px] font-black uppercase italic tracking-tighter">Cheguei</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-100 hover:text-red-600 hover:bg-red-50" onClick={() => { if(confirm('Dispensa do elenco?')) fetch(`/api/players/${p.id}`, { method: 'DELETE' }).then(fetchPlayers) }}>
                             <Trash2 size={12}/>
                          </Button>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'financeiro' && (
            <motion.div key="financeiro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="bg-[#1D1D1F] rounded-3xl p-12 text-white relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <Trophy className="text-orange-500" size={48} />
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-none max-w-xl">Patrocínio Amigos da Bola ⚽</h2>
                    <div className="flex gap-10 pt-10 border-t border-white/10">
                       <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-zinc-500">Saldo Disponível</span>
                          <p className="text-4xl font-black italic text-orange-500">R$ {(players?.filter(p => p.status_payment === 'PAGO').length || 0) * 40}</p>
                       </div>
                       <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-zinc-500">Em Aberto</span>
                          <p className="text-4xl font-black italic text-red-500">R$ {(players?.filter(p => p.status_payment === 'PENDENTE').length || 0) * 40}</p>
                       </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 opacity-10 p-20 rotate-12">
                    <Users size={300} />
                  </div>
               </div>

               <div className="bg-white rounded-3xl p-8 border border-zinc-200">
                  <Table>
                    <TableHeader className="bg-zinc-50 uppercase text-[10px] font-black italic">
                      <TableRow>
                        <TableHead>Elenco</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map(p => (
                        <TableRow key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <TableCell className="font-black uppercase italic">{p.name}</TableCell>
                          <TableCell className="font-mono text-xs italic text-zinc-400">{p.phone}</TableCell>
                          <TableCell>
                            <Badge className={`rounded-full uppercase text-[8px] font-black px-3 ${p.status_payment === 'PAGO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.status_payment}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button onClick={() => togglePayment(p)} variant="ghost" className="text-[10px] font-black uppercase italic">Trocar Status</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </div>
            </motion.div>
          )}

          {activeTab === 'fairplay' && (
            <motion.div key="fairplay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
               <div className="text-center space-y-4 py-10">
                 <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Scouts do<br/>Fair Play</h2>
                 <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">A régua moral do nosso futebol. Disciplina gera pontos.</p>
               </div>
               
               <div className="bg-white rounded-3xl p-8 border-none shadow-sm">
                  <Table>
                    <TableHeader className="bg-zinc-50 uppercase text-[10px] font-black italic">
                      <TableRow>
                        <TableHead className="w-20">#</TableHead>
                        <TableHead>Atleta</TableHead>
                        <TableHead className="text-right">Scout Total</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.map((item, idx) => {
                         const p = players.find(p => p.name === item.name);
                         return (
                          <TableRow key={idx} className={`border-b border-zinc-100 ${idx < 3 ? 'bg-orange-50/50' : ''}`}>
                            <TableCell className="font-black italic text-zinc-400">{idx + 1}º</TableCell>
                            <TableCell className="font-black uppercase italic text-sm">{item.name}</TableCell>
                            <TableCell className="text-right font-black text-lg italic" style={{ color: settings.primary_color }}>{item.total_score} pts</TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-1">
                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50" onClick={() => p && handleFairPlayEvent(p.id, 'COMPORTAMENTO', 5, 'Bônus manual')}>+5</Button>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-rose-600 hover:bg-rose-50" onClick={() => p && handleFairPlayEvent(p.id, 'ADVERTENCIA', -5, 'Multa manual')}>-5</Button>
                               </div>
                            </TableCell>
                          </TableRow>
                         );
                      })}
                    </TableBody>
                  </Table>
               </div>
            </motion.div>
          )}

          {activeTab === 'estatisticas' && (
            <motion.div key="estatisticas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                     <div className="flex justify-between items-center text-orange-600">
                        <Award size={24} />
                        <span className="text-[10px] font-black uppercase italic">Artilheiros</span>
                     </div>
                     <div className="space-y-2">
                        {monthlyStats?.topScorers?.map((s, i) => (
                           <div key={i} className="flex justify-between border-b pb-1 last:border-0">
                              <span className="font-black uppercase text-xs italic truncate max-w-[120px]">{s.name}</span>
                              <span className="font-black italic text-orange-600 text-sm">{s.goals}</span>
                           </div>
                        ))}
                        {!monthlyStats?.topScorers.length && <p className="text-zinc-400 text-[10px] text-center py-4">Aguardando gols...</p>}
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                     <div className="flex justify-between items-center text-rose-600">
                        <ShieldCheck size={24} />
                        <span className="text-[10px] font-black uppercase italic">Faltosos</span>
                     </div>
                     <div className="space-y-2">
                        {monthlyStats?.mostFouls?.map((s, i) => (
                           <div key={i} className="flex justify-between border-b pb-1 last:border-0">
                              <span className="font-black uppercase text-xs italic truncate max-w-[120px]">{s.name}</span>
                              <span className="font-black italic text-rose-600 text-sm">{s.fouls}</span>
                           </div>
                        ))}
                        {!monthlyStats?.mostFouls.length && <p className="text-zinc-400 text-[10px] text-center py-4">Guerreiros limpos!</p>}
                     </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                     <div className="flex justify-between items-center text-emerald-600">
                        <Star size={24} />
                        <span className="text-[10px] font-black uppercase italic">Fair Play Top</span>
                     </div>
                     <div className="space-y-2">
                        {monthlyStats?.fairPlayRanking?.map((s, i) => (
                           <div key={i} className="flex justify-between border-b pb-1 last:border-0">
                              <span className="font-black uppercase text-xs italic truncate max-w-[120px]">{s.name}</span>
                              <span className="font-black italic text-emerald-600 text-sm">{s.total_score}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="bg-[#1D1D1F] p-8 rounded-[40px] text-white space-y-8">
                  <div className="flex justify-between items-center">
                     <h2 className="text-3xl font-black uppercase italic tracking-tighter">Histórico Mensal</h2>
                     <Dialog>
                        <DialogTrigger render={<Button className="bg-white text-black font-black uppercase italic rounded-xl px-6">Registrar Placar</Button>} />
                        <DialogContent className="rounded-3xl p-8">
                           <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">Gravar Resultado</DialogTitle></DialogHeader>
                           <form className="space-y-6 pt-4" onSubmit={async (e) => {
                             e.preventDefault();
                             const fd = new FormData(e.currentTarget);
                             await fetch('/api/matches', {
                               method: 'POST',
                               headers: {'Content-Type': 'application/json'},
                               body: JSON.stringify({
                                 team_a_score: parseInt(fd.get('a') as string),
                                 team_b_score: parseInt(fd.get('b') as string),
                                 notes: fd.get('n')
                               })
                             });
                             fetchMonthlyStats();
                             toast.success('Partida registrada!');
                           }}>
                              <div className="grid grid-cols-2 gap-4">
                                 <Input name="a" type="number" placeholder="Time A" className="h-14 text-center text-2xl font-black rounded-2xl" />
                                 <Input name="b" type="number" placeholder="Time B" className="h-14 text-center text-2xl font-black rounded-2xl" />
                              </div>
                              <Input name="n" placeholder="Notas (ex: Goleada do Time A)" className="h-12 rounded-xl" />
                              <Button type="submit" className="w-full h-14 bg-emerald-600 font-black uppercase italic rounded-2xl">Confirmar</Button>
                           </form>
                        </DialogContent>
                     </Dialog>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                     {monthlyStats?.matches.map((m, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase opacity-40">{new Date(m.date).toLocaleDateString()}</span>
                              <p className="font-black uppercase italic text-sm">{m.notes || 'Partida comum'}</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-3xl font-black italic">{m.team_a_score} x {m.team_b_score}</div>
                              <Trophy size={20} className={m.team_a_score > m.team_b_score ? 'text-orange-500' : 'text-zinc-600'} />
                           </div>
                        </div>
                      ))}
                      {!monthlyStats?.matches.length && <p className="text-center py-20 opacity-30 uppercase font-black italic">Nenhuma partida registrada</p>}
                  </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- Add Atleta Dialog --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="rounded-3xl border-none p-8 max-w-md">
          <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic">Nova Contratação</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">Nome do Jogador</Label>
                <Input value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="rounded-xl h-12 border-zinc-200 outline-none" style={{ borderColor: settings.primary_color }} placeholder="Capitão do Time" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="uppercase text-[10px] font-black text-zinc-400">Congregação</Label>
                   <Input value={newPlayer.congregation} onChange={e => setNewPlayer({...newPlayer, congregation: e.target.value})} className="rounded-xl h-12 border-zinc-200" placeholder="Ex: Central" />
                </div>
                <div className="space-y-2">
                   <Label className="uppercase text-[10px] font-black text-zinc-400">Idade</Label>
                   <Input type="number" value={newPlayer.age} onChange={e => setNewPlayer({...newPlayer, age: e.target.value})} className="rounded-xl h-12 border-zinc-200" placeholder="25" />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">WhatsApp</Label>
                <Input value={newPlayer.phone} onChange={e => setNewPlayer({...newPlayer, phone: e.target.value})} className="rounded-xl h-12 border-zinc-200" placeholder="+55 ..." />
             </div>
          </div>
          <DialogFooter>
             <Button onClick={handleAddPlayer} className="w-full h-14 rounded-2xl uppercase font-black italic text-lg text-white" style={{ backgroundColor: settings.primary_color }}>Assinar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Edit Atleta Dialog --- */}
      <Dialog open={isEditPlayerOpen} onOpenChange={setIsEditPlayerOpen}>
        <DialogContent className="rounded-3xl border-none p-8 max-w-md">
          <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic">Editar Atleta</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">Nome do Jogador</Label>
                <Input value={editingPlayer?.name || ''} onChange={e => editingPlayer && setEditingPlayer({...editingPlayer, name: e.target.value})} className="rounded-xl h-12 border-zinc-200 outline-none" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="uppercase text-[10px] font-black text-zinc-400">Congregação</Label>
                   <Input value={editingPlayer?.congregation || ''} onChange={e => editingPlayer && setEditingPlayer({...editingPlayer, congregation: e.target.value})} className="rounded-xl h-12 border-zinc-200" />
                </div>
                <div className="space-y-2">
                   <Label className="uppercase text-[10px] font-black text-zinc-400">Idade</Label>
                   <Input type="number" value={editingPlayer?.age || ''} onChange={e => editingPlayer && setEditingPlayer({...editingPlayer, age: e.target.value ? parseInt(e.target.value) : undefined})} className="rounded-xl h-12 border-zinc-200" />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">WhatsApp</Label>
                <Input value={editingPlayer?.phone || ''} onChange={e => editingPlayer && setEditingPlayer({...editingPlayer, phone: e.target.value})} className="rounded-xl h-12 border-zinc-200" />
             </div>
          </div>
          <DialogFooter>
             <Button onClick={handleEditPlayer} className="w-full h-14 rounded-2xl uppercase font-black italic text-lg text-white" style={{ backgroundColor: settings.primary_color }}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Settings Dialog --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-3xl border-none p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic">Configurações</DialogTitle>
            <DialogDescription className="uppercase text-[10px] font-bold">Gerencie os parâmetros do Amigos da Bola ⚽.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6 border-y border-zinc-100 my-4 h-[60vh] overflow-y-auto pr-2">
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">{t('idioma')}</Label>
                <Select value={settings.language} onValueChange={(v: any) => setSettings({...settings, language: v})}>
                   <SelectTrigger className="rounded-xl h-12 border-zinc-200">
                      <SelectValue placeholder="Selecione o Idioma" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="pt">Português (Brasil)</SelectItem>
                      <SelectItem value="en">English (US)</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">Saldo Resenha (Acumulado)</Label>
                <Input type="number" value={settings.resenha_balance} onChange={e => setSettings({...settings, resenha_balance: e.target.value})} className="rounded-xl h-12 border-zinc-200" />
             </div>
             
             <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black text-zinc-400">Cor Principal</Label>
                <div className="flex gap-4 items-center">
                  <Input type="color" value={settings.primary_color} onChange={e => setSettings({...settings, primary_color: e.target.value})} className="h-12 w-20 p-1 rounded-xl border-zinc-200" />
                  <span className="font-mono text-xs font-bold uppercase">{settings.primary_color}</span>
                </div>
             </div>

             <div className="pt-4 space-y-4">
                <h4 className="text-xs font-black uppercase italic border-l-2 border-emerald-500 pl-2">Integração Google Sheets</h4>
                <div className="bg-emerald-50 p-6 rounded-2xl space-y-4">
                   <p className="text-[10px] font-bold uppercase text-emerald-800 leading-tight">
                     Vincule seu sistema a uma planilha profissional do Google para receber Membros, Presença, Ranking e Partidas em abas separadas.
                   </p>
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase opacity-60">ID da Planilha (Variável: VITE_SPREADSHEET_ID)</Label>
                      <Input 
                         placeholder="Ex: 1abcd...xyz" 
                         value={settings.spreadsheet_id || ''} 
                         onChange={e => setSettings({...settings, spreadsheet_id: e.target.value})} 
                         className="h-12 rounded-xl bg-white border-emerald-100 font-mono text-xs"
                      />
                      {settings.spreadsheet_id && (
                       <a 
                         href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheet_id}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="text-[9px] font-bold text-emerald-600 underline flex items-center gap-1 mt-1"
                       >
                         <ExternalLink size={10} /> Abrir Planilha no Google Docs
                       </a>
                      )}
                   </div>

                   <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase opacity-60">Google OAuth Client ID (Variável: VITE_GOOGLE_CLIENT_ID)</Label>
                      <Input 
                         placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com" 
                         value={settings.google_client_id || ''} 
                         onChange={e => setSettings({...settings, google_client_id: e.target.value})} 
                         className="h-12 rounded-xl bg-white border-emerald-100 font-mono text-xs"
                      />
                      <p className="text-[8px] font-bold text-emerald-700 leading-tight mt-1">
                        ⚠️ Este ID é obrigatório para autenticar no Google. Pegue-o no Console de APIs do Google Cloud.
                      </p>
                   </div>

                   <div className="p-4 bg-white/60 border border-emerald-100 rounded-xl space-y-4">
                      <h5 className="text-[9px] font-black uppercase text-emerald-900 flex items-center gap-2">
                        <Info size={12} /> Guia de Configuração Profissional (Anti-Perda)
                      </h5>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-emerald-700">1. Como criar a Planilha Perfeita:</p>
                          <ol className="text-[9px] font-medium text-emerald-800 space-y-1 list-decimal ml-4">
                            <li>Crie uma nova planilha no Google Drive.</li>
                            <li>Nomeie a planilha como <b>"GESTÃO BABA BOLA"</b>.</li>
                            <li>Crie exatamente 4 abas com estes nomes: <b>Membros</b>, <b>Presença</b>, <b>Ranking</b>, <b>Partidas</b>.</li>
                            <li>O sistema preencherá os cabeçalhos automaticamente na primeira sincronização.</li>
                          </ol>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-emerald-700">2. Como Proteger o Link (Persistência):</p>
                          <ul className="text-[9px] font-medium text-emerald-800 space-y-1 list-disc ml-4">
                            <li>O ID inserido acima é salvo no banco de dados local (SQLite) e sincronizado com a Nuvem (Firebase).</li>
                            <li><b>Segurança Total:</b> Se você trocar de celular ou limpar o histórico, o sistema recupera o ID da planilha automaticamente assim que você logar ou o sistema iniciar, buscando na nuvem.</li>
                            <li>Mantenha o status do Firebase em "CONECTADO" para garantir esta proteção redundante.</li>
                          </ul>
                        </div>
                      </div>
                   </div>

                   <Button 
                    onClick={handleSheetsSync}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic rounded-xl flex gap-2 text-xs"
                   >
                     <FileSpreadsheet size={18} />
                     Sincronizar Sistema Completo
                   </Button>
                </div>
             </div>

             <div className="pt-4 space-y-4">
                <h4 className="text-xs font-black uppercase italic border-l-2 border-zinc-500 pl-2">Status da Nuvem (Firebase)</h4>
                <div className="bg-zinc-50 p-4 rounded-xl space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-400">Conexão Firestore</span>
                      <Badge className={cloudStatus?.cloud_accessible ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                        {cloudStatus?.cloud_accessible ? 'CONECTADO' : 'DESCONECTADO'}
                      </Badge>
                   </div>
                   {!cloudStatus?.cloud_accessible && (
                     <p className="text-[10px] text-rose-600 font-bold uppercase leading-tight bg-rose-50 p-2 rounded">
                       ⚠️ Atenção: Suas permissões de nuvem ainda não foram propagadas. Os dados estão sendo salvos apenas localmente (Temporário).
                     </p>
                   )}
                   <Button 
                    disabled={loading || !cloudStatus?.cloud_sync_enabled} 
                    onClick={handleForceMigration} 
                    className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] flex gap-2"
                   >
                     <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                     Forçar Sincronismo com Nuvem
                   </Button>
                </div>

              <div className="pt-4 space-y-4">
                 <h4 className="text-xs font-black uppercase italic border-l-2 border-purple-500 pl-2">Integração Automação (Make / Webhooks)</h4>
                 <div className="bg-purple-50 p-6 rounded-2xl space-y-4">
                    <div className="space-y-1">
                       <Label className="text-[9px] font-black uppercase opacity-60">URL do Webhook (Make.com - Variável: VITE_MAKE_WEBHOOK_URL)</Label>
                       <Input 
                          placeholder="https://hook.make.com/..." 
                          value={settings.make_webhook_url || ''} 
                          onChange={e => setSettings({...settings, make_webhook_url: e.target.value})} 
                          className="h-12 rounded-xl bg-white border-purple-100 font-mono text-xs"
                       />
                       <p className="text-[8px] font-bold text-purple-700 leading-tight mt-1">
                         * O sistema enviará os dados do atleta para esta URL após cada contratação.
                       </p>
                    </div>
                 </div>
              </div>

              <h4 className="text-xs font-black uppercase italic border-l-2 border-orange-500 pl-2">Zona de Perigo</h4>
                <div className="flex flex-col gap-2">
                                       <p className="text-[10px] text-zinc-500 uppercase font-medium">Backup e Nuvem:</p>
                    <div className="flex flex-col gap-2 mb-4">
                       <Button onClick={handleExportBackup} className="h-10 rounded-lg bg-emerald-600 font-bold uppercase text-[10px] text-white">Exportar Backup</Button>
                       <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => (document.getElementById('import-merge') as any).click()} className="h-10 rounded-lg font-bold uppercase text-[10px]">Mesclar <input id="import-merge" type="file" className="hidden" accept=".json" onChange={e => handleImportBackup(e, 'merge')} /></Button>
                          <Button variant="outline" onClick={() => (document.getElementById('import-overwrite') as any).click()} className="h-10 rounded-lg font-bold uppercase text-[10px]">Substituir <input id="import-overwrite" type="file" className="hidden" accept=".json" onChange={e => handleImportBackup(e, 'overwrite')} /></Button>
                       </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-medium">Ações administrativas irreversíveis.</p>

                   <Button variant="outline" className="justify-start border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold uppercase text-[10px]" onClick={() => { if(confirm('Excluir todos os registros de presença?')) fetch('/api/attendance', { method: 'DELETE' }).then(fetchAttendance) }}>Limpar Histórico de Presença</Button>
                   <Button variant="outline" className="justify-start border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold uppercase text-[10px]" onClick={() => { if(confirm('Excluir todos os registros de Fair Play?')) fetch('/api/fairplay/event', { method: 'DELETE' }).then(fetchRanking) }}>Resetar Ranking Fair Play</Button>
                </div>
             </div>
          </div>
          <DialogFooter className="flex flex-col gap-4">
             <Button onClick={() => handleUpdateSettings(settings)} className="w-full h-14 rounded-2xl uppercase font-black italic text-lg text-white" style={{ backgroundColor: settings.primary_color }}>Salvar Configurações</Button>
             <div className="text-center">
               <p className="text-[10px] font-black uppercase text-zinc-300 italic tracking-[0.2em]">Desenvolvido por Jaal Silva</p>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Confirm Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="rounded-3xl border-none p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic text-center">Confirmar Pagamento</DialogTitle>
            <DialogDescription className="text-center font-bold uppercase text-[10px] text-zinc-500">
              Registrar pagamento mensal para {paymentPlayer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="uppercase font-black text-[10px] text-zinc-400">Data do Pagamento</Label>
              <Input 
                type="date" 
                value={paymentDate} 
                onChange={e => setPaymentDate(e.target.value)} 
                className="rounded-xl h-12 border-zinc-200 font-bold"
              />
            </div>
            {paymentDate && new Date(paymentDate + 'T12:00:00').getDate() <= 5 && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs">+10</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-700">Bônus Antecipado Ativado!</p>
                  <p className="text-[9px] font-bold text-emerald-600 leading-tight">Pagamentos até o dia 05 garantem 10 pontos de Fair Play.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button 
              onClick={handleConfirmPayment} 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic text-lg"
            >
              {loading ? <RefreshCw className="animate-spin" /> : 'Confirmar e Pontuar'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsPaymentOpen(false)} 
              className="w-full font-bold uppercase text-[10px] text-zinc-400 shadow-none border-none hover:bg-transparent"
            >
              Cancelar
            </Button>
          </DialogFooter>
          <div className="text-center pt-4 border-t border-zinc-100">
            <p className="text-[9px] font-bold uppercase text-zinc-300 italic tracking-widest">Desenvolvido por Jaal Silva</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Sticky Mobile Menu */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 text-white p-2 flex justify-around z-50 rounded-t-3xl shadow-2xl" style={{ backgroundColor: settings.primary_color }}>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'bg-white/20' : ''}><Trophy size={20}/></Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('partida')} className={activeTab === 'partida' ? 'bg-white/20' : ''}><Timer size={20}/></Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('estatisticas')} className={activeTab === 'estatisticas' ? 'bg-white/20' : ''}><Database size={20}/></Button>
        <Button variant="ghost" size="icon" onClick={() => setActiveTab('financeiro')} className={activeTab === 'financeiro' ? 'bg-white/20' : ''}><Wallet size={20}/></Button>
      </div>

      <div className="hidden md:block fixed bottom-4 right-8 z-40">
        <p className="text-[10px] font-black uppercase text-zinc-300 italic tracking-[0.3em]">Desenvolvido por Jaal Silva</p>
      </div>

      {/* --- First Match Prompt --- */}
      <Dialog open={isFirstMatchPromptOpen} onOpenChange={setIsFirstMatchPromptOpen}>
        <DialogContent className="rounded-3xl border-none p-8 max-w-sm text-center">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic text-center">{t('primeiraPartida')}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-6">
            <Button className="h-16 rounded-2xl bg-orange-600 text-white font-black uppercase italic text-lg" onClick={() => { setIsFirstMatchPromptOpen(false); setIsDraftOpen(true); }}>Sim, Sortear!</Button>
            <Button variant="outline" className="h-16 rounded-2xl font-black uppercase italic text-lg" onClick={() => { setIsFirstMatchPromptOpen(false); handleTimerControl('START'); }}>Não, Apenas Iniciar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Draft Modal --- */}
      <Dialog open={isDraftOpen} onOpenChange={setIsDraftOpen}>
        <DialogContent className="rounded-3xl border-none p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic">{t('sorteio')}</DialogTitle>
            <DialogDescription className="uppercase text-[10px] font-bold">{t('selecionarAtletas')} ({draftSelection.length}/12)</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-[10px] font-black uppercase text-zinc-400 italic">Lista de Nomes / Atleta Avulso</Label>
                  <Button 
                    variant="ghost" 
                    className="h-6 text-[9px] font-black uppercase text-orange-600 hover:text-orange-700 p-0"
                    onClick={() => setManualName(atletasIniciais.join(', '))}
                  >
                    Preencher Automático
                  </Button>
                </div>
                <textarea 
                  placeholder="Atleta Avulso 1, Atleta Avulso 2... (Cole sua lista aqui)" 
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)}
                  className="rounded-xl p-3 min-h-[80px] bg-white border border-zinc-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                />
                <Button onClick={() => { 
                  if(manualName) { 
                    const names = manualName.split(/[,\n]/).map(n => n.trim()).filter(n => n && !draftSelection?.includes(n));
                    const availableSlots = 12 - draftSelection.length;
                    const toAdd = names.slice(0, availableSlots);
                    if (toAdd.length) {
                      setDraftSelection([...draftSelection, ...toAdd]);
                      setManualName('');
                      toast.success(`${toAdd.length} atleta(s) adicionado(s)`);
                    } else if (draftSelection.length >= 12) {
                      toast.error('Limite de 12 atletas atingido');
                    }
                  } 
                }} className="w-full h-12 rounded-xl px-6 bg-zinc-900 hover:bg-black text-white font-black uppercase italic shadow-md transition-all active:scale-95">
                  {t('adicionar')}
                </Button>
              </div>
              <p className="text-[9px] text-zinc-400 font-bold uppercase italic text-center">* O sistema dividirá nomes separados por vírgula ou nova linha</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map(p => (
                <Button 
                  key={p.id} 
                  variant={draftSelection.includes(p.name) ? 'default' : 'outline'}
                  className={`h-10 rounded-lg justify-start text-[10px] font-bold uppercase truncate transition-all ${draftSelection.includes(p.name) ? 'bg-orange-600 border-none' : ''}`}
                  onClick={() => {
                    if (draftSelection.includes(p.name)) {
                      setDraftSelection(draftSelection?.filter(n => n !== p.name) || []);
                    } else if (draftSelection.length < 12) {
                      setDraftSelection([...draftSelection, p.name]);
                    }
                  }}
                >
                  {p.name}
                </Button>
              ))}
            </div>

            <div className="bg-zinc-50 p-4 rounded-2xl">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-400">Selecionados</span>
                <Button variant="link" className="h-auto p-0 text-[10px] font-black text-rose-600 uppercase" onClick={() => setDraftSelection([])}>{t('limpar')}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draftSelection.map((name, i) => (
                  <Badge key={i} className="bg-zinc-200 text-zinc-800 border-none font-bold uppercase text-[9px] px-2 py-1 flex items-center gap-1">
                    {name}
                    <Trash2 size={10} className="cursor-pointer text-zinc-400 hover:text-red-500" onClick={() => setDraftSelection(draftSelection?.filter(n => n !== name) || [])} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              disabled={draftSelection.length < 12}
              onClick={runDraft} 
              className="w-full h-16 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase italic text-xl shadow-xl disabled:opacity-50"
            >
              {t('confirmarSorteio')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="max-w-7xl mx-auto px-8 py-10 text-center space-y-2 opacity-30">
        <p className="text-[10px] font-black uppercase italic tracking-[0.3em]">Amigos da Bola ⚽ • Enterprise Edition</p>
        <p className="text-[8px] font-bold uppercase tracking-widest">Desenvolvido por Jaal Silva</p>
      </footer>
    </div>
  );
}
