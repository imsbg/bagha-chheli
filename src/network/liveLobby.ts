import Peer, { DataConnection } from 'peerjs';

export interface PublicLiveMatch {
  roomCode: string;
  hostName: string;
  guestName: string | null;
  status: 'waiting' | 'playing' | 'won' | 'draw';
  mode: 'online' | 'bot' | 'pass';
  spectatorsCount: number;
  scores: { TIGER: number; GOAT: number; draws: number };
  round: number;
  goatsCaptured?: number;
  goatsPlacedTotal?: number;
  updatedAt: number;
  lastActivityAt: number;
}

type LobbyMessage =
  | { type: 'ANNOUNCE_MATCH'; match: PublicLiveMatch }
  | { type: 'REMOVE_MATCH'; roomCode: string }
  | { type: 'SYNC_LIST'; matches: PublicLiveMatch[] }
  | { type: 'REQUEST_LIST' };

const HUB_PEER_ID = 'bagha-chheli-public-lobby-v1';
const STORAGE_KEY = 'baghachheli_public_matches_v1';
const CACHE_NAME = 'baghachheli-live-matches-cache-v1';
const CACHE_URL = '/__local_cache__/live-matches.json';

// Auto-remove matches if inactive for more than 2 minutes (120,000ms)
export const INACTIVITY_TIMEOUT_MS = 120_000;

const PEER_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * Distributed Live Lobby Discovery Registry + Persistent Phone Cache (localStorage + CacheStorage)
 * Works across tabs via BroadcastChannel, across devices via a shared WebRTC Hub Peer,
 * and persists in phone cache until a match is inactive for > 2 minutes.
 */
export class LiveLobbyRegistry {
  private matches: Map<string, PublicLiveMatch> = new Map();
  private listeners: Set<(matches: PublicLiveMatch[]) => void> = new Set();
  private bc: BroadcastChannel | null = null;
  private hubPeer: Peer | null = null;
  private clientPeer: Peer | null = null;
  private clientConn: DataConnection | null = null;
  private hubConnections: Set<DataConnection> = new Set();
  private isHub: boolean = false;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.initBroadcastChannel();
    this.initPeerDiscovery();

    this.cleanupTimer = setInterval(() => {
      this.pruneStaleMatches();
    }, 5000);
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw) as PublicLiveMatch[];
        const now = Date.now();
        list.forEach((m) => {
          const lastActive = m.lastActivityAt || m.updatedAt || 0;
          if (now - lastActive < INACTIVITY_TIMEOUT_MS) {
            this.matches.set(m.roomCode, {
              ...m,
              lastActivityAt: lastActive,
            });
          }
        });
      }
    } catch {
      // Ignore storage errors
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.match(CACHE_URL))
        .then((res) => (res ? res.json() : null))
        .then((list: PublicLiveMatch[] | null) => {
          if (!list || !Array.isArray(list)) return;
          const now = Date.now();
          let changed = false;
          list.forEach((m) => {
            const lastActive = m.lastActivityAt || m.updatedAt || 0;
            if (now - lastActive < INACTIVITY_TIMEOUT_MS) {
              const existing = this.matches.get(m.roomCode);
              if (!existing || existing.updatedAt < m.updatedAt) {
                this.matches.set(m.roomCode, { ...m, lastActivityAt: lastActive });
                changed = true;
              }
            }
          });
          if (changed) {
            this.notifyListeners();
          }
        })
        .catch(() => {});
    }
  }

  private saveToStorage() {
    const arr = Array.from(this.matches.values());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // Ignore storage errors
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches
        .open(CACHE_NAME)
        .then((cache) => {
          const response = new Response(JSON.stringify(arr), {
            headers: { 'Content-Type': 'application/json' },
          });
          return cache.put(CACHE_URL, response);
        })
        .catch(() => {});
    }
  }

  public clearPhoneCache() {
    this.matches.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.delete(CACHE_NAME).catch(() => {});
    }
    this.notifyListeners();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('baghachheli_live_lobby_bc');
        this.bc.onmessage = (ev) => {
          this.handleIncomingMessage(ev.data as LobbyMessage);
        };
        this.bc.postMessage({ type: 'REQUEST_LIST' } satisfies LobbyMessage);
      } catch {
        // Ignore BroadcastChannel errors
      }
    }
  }

  private initPeerDiscovery() {
    if (this.destroyed || typeof window === 'undefined') return;

    try {
      const hub = new Peer(HUB_PEER_ID, {
        config: { iceServers: PEER_ICE_SERVERS },
      });

      hub.on('open', () => {
        if (this.destroyed) {
          hub.destroy();
          return;
        }
        this.isHub = true;
        this.hubPeer = hub;

        hub.on('connection', (conn) => {
          this.hubConnections.add(conn);
          conn.on('open', () => {
            conn.send({
              type: 'SYNC_LIST',
              matches: this.getMatches(),
            } satisfies LobbyMessage);
          });
          conn.on('data', (data) => {
            const msg = data as LobbyMessage;
            this.handleIncomingMessage(msg, conn);
          });
          conn.on('close', () => {
            this.hubConnections.delete(conn);
          });
          conn.on('error', () => {
            this.hubConnections.delete(conn);
          });
        });
      });

      hub.on('error', (err: { type?: string }) => {
        try {
          hub.destroy();
        } catch {
          // Ignore
        }
        if (err?.type === 'unavailable-id') {
          this.connectAsClient();
        } else {
          this.scheduleReconnect();
        }
      });
    } catch {
      this.scheduleReconnect();
    }
  }

  private connectAsClient() {
    if (this.destroyed) return;
    try {
      const client = new Peer({
        config: { iceServers: PEER_ICE_SERVERS },
      });
      this.clientPeer = client;

      client.on('open', () => {
        if (this.destroyed) {
          client.destroy();
          return;
        }
        const conn = client.connect(HUB_PEER_ID, { reliable: true });
        this.clientConn = conn;

        conn.on('open', () => {
          conn.send({ type: 'REQUEST_LIST' } satisfies LobbyMessage);
          this.matches.forEach((match) => {
            conn.send({ type: 'ANNOUNCE_MATCH', match } satisfies LobbyMessage);
          });
        });

        conn.on('data', (data) => {
          this.handleIncomingMessage(data as LobbyMessage);
        });

        conn.on('close', () => {
          this.clientConn = null;
          try {
            client.destroy();
          } catch {
            // Ignore
          }
          this.clientPeer = null;
          this.scheduleReconnect();
        });

        conn.on('error', () => {
          this.clientConn = null;
          try {
            client.destroy();
          } catch {
            // Ignore
          }
          this.clientPeer = null;
          this.scheduleReconnect();
        });
      });

      client.on('error', () => {
        try {
          client.destroy();
        } catch {
          // Ignore
        }
        this.clientPeer = null;
        this.scheduleReconnect();
      });
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isHub && !this.clientConn) {
        this.initPeerDiscovery();
      }
    }, 6000);
  }

  private handleIncomingMessage(msg: LobbyMessage, fromConn?: DataConnection) {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'ANNOUNCE_MATCH' && msg.match?.roomCode) {
      const incomingLastActive = msg.match.lastActivityAt || msg.match.updatedAt || Date.now();
      const now = Date.now();
      if (now - incomingLastActive >= INACTIVITY_TIMEOUT_MS) return;

      const existing = this.matches.get(msg.match.roomCode);
      if (!existing || existing.updatedAt <= msg.match.updatedAt) {
        this.matches.set(msg.match.roomCode, {
          ...msg.match,
          lastActivityAt: incomingLastActive,
        });
        this.saveToStorage();
        this.notifyListeners();
      }
      if (this.isHub) {
        this.hubConnections.forEach((c) => {
          if (c !== fromConn && c.open) {
            c.send(msg);
          }
        });
      }
    } else if (msg.type === 'REMOVE_MATCH' && msg.roomCode) {
      if (this.matches.delete(msg.roomCode)) {
        this.saveToStorage();
        this.notifyListeners();
      }
      if (this.isHub) {
        this.hubConnections.forEach((c) => {
          if (c !== fromConn && c.open) {
            c.send(msg);
          }
        });
      }
    } else if (msg.type === 'SYNC_LIST' && Array.isArray(msg.matches)) {
      let changed = false;
      const now = Date.now();
      msg.matches.forEach((m) => {
        const lastActive = m.lastActivityAt || m.updatedAt || 0;
        if (now - lastActive < INACTIVITY_TIMEOUT_MS) {
          const existing = this.matches.get(m.roomCode);
          if (!existing || existing.updatedAt < m.updatedAt) {
            this.matches.set(m.roomCode, { ...m, lastActivityAt: lastActive });
            changed = true;
          }
        }
      });
      if (changed) {
        this.saveToStorage();
        this.notifyListeners();
      }
    } else if (msg.type === 'REQUEST_LIST') {
      const current = this.getMatches();
      if (current.length > 0) {
        const reply: LobbyMessage = { type: 'SYNC_LIST', matches: current };
        if (fromConn && fromConn.open) {
          fromConn.send(reply);
        } else if (this.bc) {
          try {
            this.bc.postMessage(reply);
          } catch {
            // Ignore
          }
        }
      }
    }
  }

  public announceMatch(match: PublicLiveMatch) {
    const now = Date.now();
    const updated: PublicLiveMatch = {
      ...match,
      updatedAt: now,
      lastActivityAt: match.lastActivityAt || now,
    };
    this.matches.set(updated.roomCode, updated);
    this.saveToStorage();
    this.notifyListeners();

    const msg: LobbyMessage = { type: 'ANNOUNCE_MATCH', match: updated };
    try {
      this.bc?.postMessage(msg);
    } catch {
      // Ignore
    }

    if (this.isHub) {
      this.hubConnections.forEach((c) => {
        if (c.open) c.send(msg);
      });
    } else if (this.clientConn && this.clientConn.open) {
      this.clientConn.send(msg);
    }
  }

  public removeMatch(roomCode: string) {
    if (this.matches.delete(roomCode)) {
      this.saveToStorage();
      this.notifyListeners();
    }
    const msg: LobbyMessage = { type: 'REMOVE_MATCH', roomCode };
    try {
      this.bc?.postMessage(msg);
    } catch {
      // Ignore
    }

    if (this.isHub) {
      this.hubConnections.forEach((c) => {
        if (c.open) c.send(msg);
      });
    } else if (this.clientConn && this.clientConn.open) {
      this.clientConn.send(msg);
    }
  }

  private pruneStaleMatches() {
    const now = Date.now();
    let changed = false;
    this.matches.forEach((m, key) => {
      const lastActive = m.lastActivityAt || m.updatedAt || 0;
      if (now - lastActive > INACTIVITY_TIMEOUT_MS) {
        this.matches.delete(key);
        changed = true;
      }
    });
    if (changed) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public getMatches(): PublicLiveMatch[] {
    this.pruneStaleMatches();
    return Array.from(this.matches.values()).sort(
      (a, b) => (b.lastActivityAt || b.updatedAt) - (a.lastActivityAt || a.updatedAt)
    );
  }

  public subscribe(cb: (matches: PublicLiveMatch[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.getMatches());
    return () => {
      this.listeners.delete(cb);
    };
  }

  public requestRefresh() {
    const msg: LobbyMessage = { type: 'REQUEST_LIST' };
    try {
      this.bc?.postMessage(msg);
    } catch {
      // Ignore
    }
    if (this.clientConn && this.clientConn.open) {
      this.clientConn.send(msg);
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    const list = Array.from(this.matches.values()).sort(
      (a, b) => (b.lastActivityAt || b.updatedAt) - (a.lastActivityAt || a.updatedAt)
    );
    this.listeners.forEach((cb) => cb(list));
  }
}

export const liveLobby = new LiveLobbyRegistry();
