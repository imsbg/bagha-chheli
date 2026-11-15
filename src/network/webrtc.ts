import Peer, { DataConnection } from 'peerjs';
import {
  BaghaCoreState,
  PlayerSide,
  InitialGoatsOption,
  MoveRecord,
  RoundRecord,
  createInitialCoreState,
  applyPlayerAction,
  getTrappedTigerIndices,
} from '../game/rules';

export type NetworkRole = 'host' | 'guest' | 'spectator';

export interface PlayerInfo {
  id: string;
  name: string;
  role: 'host' | 'guest';
  side: PlayerSide;
  connected: boolean;
}

export interface SpectatorInfo {
  id: string;
  name: string;
  connected: boolean;
}

export interface RoomGameState extends BaghaCoreState {
  roomCode: string;
  players: {
    host: PlayerInfo;
    guest: PlayerInfo | null;
  };
  spectators: SpectatorInfo[];
  scores: {
    TIGER: number;
    GOAT: number;
    draws: number;
  };
  round: number;
  rematchRequests: {
    host: boolean;
    guest: boolean;
  };
  lastMove: {
    from: number | null;
    to: number;
    player: PlayerSide;
    actionType: 'place' | 'move' | 'capture';
    capturedIndex: number | null;
  } | null;
  matchStartedAt: number;
  roundStartedAt: number;
  currentRoundMoves: MoveRecord[];
  roundHistory: RoundRecord[];
  smartHintsEnabled: boolean;
}

export type NetworkMessage =
  | { type: 'JOIN_REQUEST'; name: string; clientId: string; asSpectator?: boolean }
  | { type: 'ROOM_PROBE'; clientId: string }
  | { type: 'ROOM_PROBE_RESPONSE'; isFull: boolean }
  | { type: 'STATE_SYNC'; state: RoomGameState }
  | { type: 'BOARD_ACTION'; from: number | null; to: number; player: PlayerSide }
  | { type: 'REMATCH_REQUEST'; role: 'host' | 'guest' }
  | { type: 'REACTION'; emoji: string; senderName: string; senderSide: PlayerSide | 'SPECTATOR' }
  | { type: 'LEAVE_ROOM'; role: NetworkRole; clientId?: string }
  | { type: 'PING' }
  | { type: 'PONG' };

export type ConnectionStatus =
  | 'connecting'
  | 'waiting_for_peer'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export interface RoomCallbacks {
  onStateChange: (state: RoomGameState) => void;
  onStatusChange: (status: ConnectionStatus, errorMsg?: string) => void;
  onReaction?: (emoji: string, senderName: string, senderSide: PlayerSide | 'SPECTATOR') => void;
  onActionSound?: (actionType: 'place' | 'move' | 'capture', side: PlayerSide) => void;
  onRoleChange?: (role: NetworkRole) => void;
}

interface TransportLink {
  send: (msg: NetworkMessage) => void;
  close: () => void;
}

const PEER_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

/**
 * Real-Time Room Manager for Bagha Chheli (Supports Host, Guest & Multiple Spectators)
 */
export class WebRTCNetworkRoom {
  public readonly roomCode: string;
  public role: NetworkRole;
  public readonly localName: string;
  public readonly localClientId: string;
  private peer: Peer | null = null;
  private guestTransport: TransportLink | null = null;
  private spectatorTransports: Map<string, TransportLink> = new Map();
  private hostTransport: TransportLink | null = null;
  private bc: BroadcastChannel | null = null;
  private callbacks: RoomCallbacks;
  private state: RoomGameState;
  private status: ConnectionStatus = 'connecting';
  private destroyed = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    roomCode: string,
    role: NetworkRole,
    localName: string,
    callbacks: RoomCallbacks,
    initialGuestOverride?: PlayerInfo | null,
    smartHintsEnabled: boolean = false,
    hostSide: PlayerSide = 'TIGER',
    initialGoatsBatch: InitialGoatsOption = 4
  ) {
    this.roomCode = roomCode.toUpperCase();
    this.role = role;
    this.localName = localName.trim() || (role === 'host' ? 'Player 1' : role === 'guest' ? 'Player 2' : 'Spectator');
    this.localClientId = `${role}-${Math.random().toString(36).substring(2, 9)}`;
    this.callbacks = callbacks;

    const now = Date.now();
    const core = createInitialCoreState(initialGoatsBatch);
    this.state = {
      ...core,
      roomCode: this.roomCode,
      players: {
        host: {
          id: 'host',
          name: role === 'host' ? this.localName : 'Host',
          role: 'host',
          side: hostSide,
          connected: true,
        },
        guest: initialGuestOverride ?? null,
      },
      spectators: [],
      scores: { TIGER: 0, GOAT: 0, draws: 0 },
      round: 1,
      rematchRequests: { host: false, guest: false },
      lastMove: null,
      matchStartedAt: now,
      roundStartedAt: now,
      currentRoundMoves: [],
      roundHistory: [],
      smartHintsEnabled,
    };

    this.init();
  }

  private getHostPeerId(): string {
    return `bagha-chheli-room-${this.roomCode.toLowerCase()}`;
  }

  private init() {
    this.setupBroadcastChannelFallback();
    this.setupPeerJS();
  }

  private setupBroadcastChannelFallback() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      const channelName = `baghachheli_bc_${this.roomCode}`;
      const bc = new BroadcastChannel(channelName);
      this.bc = bc;

      bc.onmessage = (event) => {
        if (this.destroyed) return;
        const data = event.data as {
          senderRole: NetworkRole;
          senderId: string;
          targetId?: string;
          msg: NetworkMessage;
        };
        if (!data || data.senderId === this.localClientId) return;
        if (data.targetId && data.targetId !== this.localClientId) return;

        if (this.role === 'host') {
          const replyLink: TransportLink = {
            send: (m: NetworkMessage) => {
              bc.postMessage({
                senderRole: 'host',
                senderId: this.localClientId,
                targetId: data.senderId,
                msg: m,
              });
            },
            close: () => {},
          };

          this.handleMessage(data.msg, data.senderId, replyLink);
        } else {
          if (data.senderRole === 'host') {
            if (!this.hostTransport) {
              this.hostTransport = {
                send: (m: NetworkMessage) => {
                  bc.postMessage({
                    senderRole: this.role,
                    senderId: this.localClientId,
                    msg: m,
                  });
                },
                close: () => {},
              };
            }
            this.handleMessage(data.msg, 'host');
          }
        }
      };

      if (this.role === 'guest' || this.role === 'spectator') {
        setTimeout(() => {
          if (this.destroyed || this.status === 'connected') return;
          bc.postMessage({
            senderRole: this.role,
            senderId: this.localClientId,
            msg: {
              type: 'JOIN_REQUEST',
              name: this.localName,
              clientId: this.localClientId,
              asSpectator: this.role === 'spectator',
            } satisfies NetworkMessage,
          });
        }, 120);
      }
    } catch {
      // Ignore BroadcastChannel errors
    }
  }

  private setupPeerJS() {
    const hostPeerId = this.getHostPeerId();

    try {
      if (this.role === 'host') {
        this.updateStatus('connecting');
        const peer = new Peer(hostPeerId, {
          config: { iceServers: PEER_ICE_SERVERS },
        });
        this.peer = peer;

        peer.on('open', () => {
          if (this.destroyed) return;
          if (this.state.players.guest?.connected) {
            this.updateStatus('connected');
          } else {
            this.updateStatus('waiting_for_peer');
          }
          this.callbacks.onStateChange({ ...this.state });
        });

        peer.on('connection', (conn: DataConnection) => {
          if (this.destroyed) return;
          this.bindHostIncomingConnection(conn);
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          if (this.destroyed) return;
          if (err.type === 'unavailable-id') {
            this.updateStatus('error', `Room ${this.roomCode} is already active in another window.`);
          } else {
            if (this.status !== 'connected') {
              this.updateStatus('waiting_for_peer');
            }
          }
        });
      } else {
        this.updateStatus('connecting');
        const peer = new Peer({
          config: { iceServers: PEER_ICE_SERVERS },
        });
        this.peer = peer;

        peer.on('open', () => {
          if (this.destroyed) return;
          this.connectClientToHost(peer, hostPeerId);
        });

        peer.on('error', (err: { type?: string; message?: string }) => {
          if (this.destroyed) return;
          if (this.status === 'connected') return;
          if (err.type === 'peer-unavailable') {
            this.updateStatus('error', `Room ${this.roomCode} not found or host is offline.`);
          } else {
            this.scheduleClientReconnect(peer, hostPeerId);
          }
        });
      }
    } catch {
      if (this.role === 'host') {
        this.updateStatus(this.state.players.guest?.connected ? 'connected' : 'waiting_for_peer');
      }
    }
  }

  private connectClientToHost(peer: Peer, hostPeerId: string) {
    if (this.destroyed || this.status === 'connected') return;

    const conn = peer.connect(hostPeerId, { reliable: true });
    this.bindClientConnection(conn);
  }

  private scheduleClientReconnect(peer: Peer, hostPeerId: string) {
    if (this.destroyed || this.status === 'connected') return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.updateStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      if (this.destroyed || this.status === 'connected') return;
      if (peer && !peer.destroyed) {
        this.connectClientToHost(peer, hostPeerId);
      }
    }, 2500);
  }

  private bindHostIncomingConnection(conn: DataConnection) {
    let remoteClientId = conn.peer;

    const link: TransportLink = {
      send: (msg: NetworkMessage) => {
        if (conn.open) {
          conn.send(msg);
        }
      },
      close: () => {
        conn.close();
      },
    };

    conn.on('data', (raw) => {
      if (this.destroyed) return;
      const msg = raw as NetworkMessage;
      if (msg.type === 'JOIN_REQUEST') {
        remoteClientId = msg.clientId || conn.peer;
      }
      this.handleMessage(msg, remoteClientId, link);
    });

    conn.on('close', () => {
      if (this.destroyed) return;
      if (this.spectatorTransports.has(remoteClientId)) {
        this.spectatorTransports.delete(remoteClientId);
        this.state.spectators = this.state.spectators.filter((s) => s.id !== remoteClientId);
        this.broadcastState();
      } else if (
        this.state.players.guest &&
        this.state.players.guest.id === remoteClientId &&
        this.state.players.guest.id !== 'bot' &&
        this.state.players.guest.id !== 'local-guest'
      ) {
        this.state.players.guest.connected = false;
        this.updateStatus('reconnecting');
        this.broadcastState();
      }
    });

    conn.on('error', () => {
      if (this.destroyed) return;
      if (
        !this.spectatorTransports.has(remoteClientId) &&
        this.state.players.guest &&
        this.state.players.guest.id === remoteClientId &&
        this.state.players.guest.id !== 'bot' &&
        this.state.players.guest.id !== 'local-guest'
      ) {
        this.state.players.guest.connected = false;
        this.updateStatus('reconnecting');
        this.broadcastState();
      }
    });
  }

  private bindClientConnection(conn: DataConnection) {
    const link: TransportLink = {
      send: (msg: NetworkMessage) => {
        if (conn.open) {
          conn.send(msg);
        }
      },
      close: () => {
        conn.close();
      },
    };

    conn.on('open', () => {
      if (this.destroyed) return;
      this.hostTransport = link;
      this.sendToHost({
        type: 'JOIN_REQUEST',
        name: this.localName,
        clientId: this.localClientId,
        asSpectator: this.role === 'spectator',
      });
      this.startHeartbeat();
    });

    conn.on('data', (raw) => {
      if (this.destroyed) return;
      this.handleMessage(raw as NetworkMessage, 'host');
    });

    conn.on('close', () => {
      if (this.destroyed) return;
      this.updateStatus('reconnecting');
      if (this.peer && !this.peer.destroyed) {
        this.scheduleClientReconnect(this.peer, this.getHostPeerId());
      }
    });

    conn.on('error', () => {
      if (this.destroyed) return;
      this.updateStatus('reconnecting');
    });
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.destroyed) return;
      if (this.role === 'host') {
        this.broadcastMessage({ type: 'PING' });
      } else {
        this.sendToHost({ type: 'PING' });
      }
    }, 5000);
  }

  private sendToHost(msg: NetworkMessage) {
    if (this.hostTransport) {
      this.hostTransport.send(msg);
    }
  }

  private broadcastMessage(msg: NetworkMessage, excludeClientId?: string) {
    if (this.guestTransport && excludeClientId !== 'guest') {
      this.guestTransport.send(msg);
    }
    this.spectatorTransports.forEach((transport, id) => {
      if (id !== excludeClientId) {
        transport.send(msg);
      }
    });
    if (this.bc) {
      try {
        this.bc.postMessage({
          senderRole: 'host',
          senderId: this.localClientId,
          msg,
        });
      } catch {
        // Ignore
      }
    }
  }

  private broadcastState() {
    const syncMsg: NetworkMessage = { type: 'STATE_SYNC', state: this.state };
    this.broadcastMessage(syncMsg);
    this.callbacks.onStateChange({ ...this.state });
  }

  private handleMessage(msg: NetworkMessage, senderId: string, replyLink?: TransportLink) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'PING':
        if (this.role === 'host' && replyLink) {
          replyLink.send({ type: 'PONG' });
        } else if (this.role !== 'host') {
          this.sendToHost({ type: 'PONG' });
        }
        break;

      case 'PONG':
        break;

      case 'ROOM_PROBE':
        if (this.role === 'host' && replyLink) {
          const isFull =
            this.state.players.guest !== null && this.state.players.guest.connected;
          replyLink.send({ type: 'ROOM_PROBE_RESPONSE', isFull });
        }
        break;

      case 'ROOM_PROBE_RESPONSE':
        break;

      case 'JOIN_REQUEST':
        if (this.role === 'host') {
          // If the room already has an active 2nd player (Computer AI, 1-Phone Pass & Play, or another connected Guest),
          // anyone else joining MUST be added strictly as a spectator who can only watch and send reactions.
          const isJoiningAsSpectator =
            Boolean(msg.asSpectator) ||
            (this.state.players.guest !== null &&
              this.state.players.guest.connected &&
              this.state.players.guest.id !== msg.clientId);

          if (isJoiningAsSpectator) {
            if (replyLink) {
              this.spectatorTransports.set(msg.clientId, replyLink);
            }
            const existingIdx = this.state.spectators.findIndex((s) => s.id === msg.clientId);
            if (existingIdx >= 0) {
              this.state.spectators[existingIdx].name = msg.name || 'Spectator';
              this.state.spectators[existingIdx].connected = true;
            } else {
              this.state.spectators.push({
                id: msg.clientId,
                name: msg.name || 'Spectator',
                connected: true,
              });
            }
            this.broadcastState();
          } else {
            if (replyLink) {
              this.guestTransport = replyLink;
            }
            const guestSide: PlayerSide =
              this.state.players.host.side === 'TIGER' ? 'GOAT' : 'TIGER';
            this.state.players.guest = {
              id: msg.clientId || 'guest',
              name: msg.name || 'Player 2',
              role: 'guest',
              side: guestSide,
              connected: true,
            };
            this.updateStatus('connected');
            this.startHeartbeat();
            this.broadcastState();
          }
        }
        break;

      case 'STATE_SYNC':
        if (this.role !== 'host') {
          this.state = msg.state;
          // If we tried to join as 'guest' when 2 players were already playing (or vs AI / 1-phone match),
          // the host placed us in spectators — immediately switch our local role to 'spectator'
          if (
            this.role === 'guest' &&
            msg.state.players.guest?.id !== this.localClientId
          ) {
            this.role = 'spectator';
            this.callbacks.onRoleChange?.('spectator');
          }
          this.updateStatus('connected');
          this.callbacks.onStateChange({ ...this.state });
        }
        break;

      case 'BOARD_ACTION':
        if (this.role === 'host') {
          // Strictly enforce that only the active connected guest player (never a spectator) can send BOARD_ACTION
          const isAuthorizedGuest =
            this.state.players.guest !== null &&
            this.state.players.guest.connected &&
            this.state.players.guest.id === senderId &&
            senderId !== 'bot' &&
            senderId !== 'local-guest' &&
            !this.spectatorTransports.has(senderId) &&
            msg.player === this.state.players.guest.side;

          if (isAuthorizedGuest) {
            this.applyHostBoardAction(msg.from, msg.to, msg.player);
          }
        }
        break;

      case 'REMATCH_REQUEST':
        if (this.role === 'host') {
          const isAuthorizedGuest =
            this.state.players.guest !== null &&
            this.state.players.guest.connected &&
            this.state.players.guest.id === senderId &&
            senderId !== 'bot' &&
            senderId !== 'local-guest' &&
            !this.spectatorTransports.has(senderId);

          if (isAuthorizedGuest) {
            this.applyHostRematch('guest');
          }
        }
        break;

      case 'REACTION':
        if (this.role === 'host') {
          this.broadcastMessage(msg, senderId);
        }
        if (this.callbacks.onReaction) {
          this.callbacks.onReaction(msg.emoji, msg.senderName, msg.senderSide);
        }
        break;

      case 'LEAVE_ROOM':
        if (this.role === 'host') {
          if (
            (msg.role === 'spectator' || this.spectatorTransports.has(senderId)) &&
            (msg.clientId || senderId)
          ) {
            const targetId = msg.clientId || senderId;
            this.spectatorTransports.delete(targetId);
            this.state.spectators = this.state.spectators.filter((s) => s.id !== targetId);
            this.broadcastState();
          } else if (
            msg.role === 'guest' &&
            this.state.players.guest &&
            this.state.players.guest.id === (msg.clientId || senderId)
          ) {
            this.state.players.guest.connected = false;
            this.updateStatus('disconnected', 'Opponent left the room.');
            this.broadcastState();
          }
        } else {
          if (msg.role === 'host') {
            this.updateStatus('disconnected', 'Host closed the room.');
          }
        }
        break;
    }
  }

  public performBoardAction(
    from: number | null,
    to: number,
    overrideSide?: PlayerSide
  ): boolean {
    if (this.role === 'spectator') return false;
    const mySide: PlayerSide =
      overrideSide ||
      (this.role === 'host'
        ? this.state.players.host.side
        : this.state.players.guest?.side || 'GOAT');

    if (this.state.status !== 'playing') return false;
    if (this.state.currentTurn !== mySide) return false;
    if (!this.state.players.guest?.connected) return false;

    if (this.role === 'host') {
      return this.applyHostBoardAction(from, to, mySide);
    } else {
      this.sendToHost({ type: 'BOARD_ACTION', from, to, player: mySide });
      return true;
    }
  }

  private applyHostBoardAction(
    from: number | null,
    to: number,
    player: PlayerSide
  ): boolean {
    if (this.state.status !== 'playing') return false;
    if (this.state.currentTurn !== player) return false;
    if (!this.state.players.guest?.connected) return false;

    const res = applyPlayerAction(this.state, from, to, player);
    if (!res) return false;

    // Handle voluntary end of multi-jump chain capture (from = -1, to = -1)
    if (!res.actionPerformed) {
      this.state.currentTurn = res.nextState.currentTurn;
      this.state.selectedPieceIndex = null;
      this.state.chainCaptureTigerIndex = null;
      this.broadcastState();
      return true;
    }

    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - this.state.roundStartedAt) / 1000));

    const playerName =
      this.state.players.host.side === player
        ? this.state.players.host.name
        : this.state.players.guest?.name || (player === 'TIGER' ? 'Tiger' : 'Goat');

    const trappedCount = getTrappedTigerIndices(res.nextState.board).length;

    const moveRecord: MoveRecord = {
      moveNumber: this.state.currentRoundMoves.length + 1,
      player,
      playerName,
      phase: res.actionPerformed.phaseBefore,
      actionType: res.actionPerformed.actionType,
      from: res.actionPerformed.from,
      to: res.actionPerformed.to,
      capturedIndex: res.actionPerformed.capturedIndex,
      elapsedSeconds,
      goatsCapturedAfter: res.nextState.goatsCaptured,
      goatsOnBoardAfter: res.nextState.goatsOnBoard,
      trappedTigersAfter: trappedCount,
    };

    this.state.board = res.nextState.board;
    this.state.currentTurn = res.nextState.currentTurn;
    this.state.phase = res.nextState.phase;
    this.state.tigersToPlace = res.nextState.tigersToPlace;
    this.state.initialGoatsBatch = res.nextState.initialGoatsBatch;
    this.state.goatsToPlaceInitially = res.nextState.goatsToPlaceInitially;
    this.state.goatsPlacedTotal = res.nextState.goatsPlacedTotal;
    this.state.goatsOnBoard = res.nextState.goatsOnBoard;
    this.state.goatsCaptured = res.nextState.goatsCaptured;
    this.state.selectedPieceIndex = res.nextState.selectedPieceIndex;
    this.state.chainCaptureTigerIndex = res.nextState.chainCaptureTigerIndex ?? null;
    this.state.status = res.nextState.status;
    this.state.winInfo = res.nextState.winInfo;

    this.state.currentRoundMoves = [...this.state.currentRoundMoves, moveRecord];
    this.state.lastMove = {
      from: res.actionPerformed.from,
      to: res.actionPerformed.to,
      player,
      actionType: res.actionPerformed.actionType,
      capturedIndex: res.actionPerformed.capturedIndex,
    };

    if (this.callbacks.onActionSound) {
      this.callbacks.onActionSound(res.actionPerformed.actionType, player);
    }

    if (res.nextState.status === 'won' && res.nextState.winInfo) {
      const winnerSide = res.nextState.winInfo.winner;
      this.state.scores[winnerSide] += 1;

      const tigerName =
        this.state.players.host.side === 'TIGER'
          ? this.state.players.host.name
          : this.state.players.guest?.name || 'Tiger';
      const goatName =
        this.state.players.host.side === 'GOAT'
          ? this.state.players.host.name
          : this.state.players.guest?.name || 'Goat';

      const winnerName = winnerSide === 'TIGER' ? tigerName : goatName;

      const roundRecord: RoundRecord = {
        round: this.state.round,
        winner: winnerSide,
        winnerName,
        winReason: res.nextState.winInfo.reason,
        durationSeconds: elapsedSeconds,
        moves: [...this.state.currentRoundMoves],
        finalMove: moveRecord,
        finalBoard: [...this.state.board],
        goatsCaptured: this.state.goatsCaptured,
        goatsOnBoard: this.state.goatsOnBoard,
        goatsPlacedTotal: this.state.goatsPlacedTotal,
        trappedTigers: trappedCount,
        tigerPlayerName: tigerName,
        goatPlayerName: goatName,
        completedAt: now,
      };
      this.state.roundHistory = [roundRecord, ...this.state.roundHistory];
    }

    this.broadcastState();
    return true;
  }

  public requestRematch() {
    if (this.role === 'spectator') return;
    if (this.state.status === 'playing') return;

    if (this.role === 'host') {
      this.applyHostRematch('host');
    } else {
      this.sendToHost({ type: 'REMATCH_REQUEST', role: 'guest' });
    }
  }

  public forceBotRematch() {
    if (this.role !== 'host') return;
    this.startNewRound();
    this.broadcastState();
  }

  private applyHostRematch(requester: 'host' | 'guest') {
    this.state.rematchRequests[requester] = true;

    if (this.state.rematchRequests.host && this.state.rematchRequests.guest) {
      this.startNewRound();
    }

    this.broadcastState();
  }

  private startNewRound() {
    const core = createInitialCoreState(this.state.initialGoatsBatch || 4);
    const now = Date.now();
    this.state.board = core.board;
    this.state.currentTurn = core.currentTurn;
    this.state.phase = core.phase;
    this.state.tigersToPlace = core.tigersToPlace;
    this.state.initialGoatsBatch = core.initialGoatsBatch;
    this.state.goatsToPlaceInitially = core.goatsToPlaceInitially;
    this.state.goatsPlacedTotal = core.goatsPlacedTotal;
    this.state.goatsOnBoard = core.goatsOnBoard;
    this.state.goatsCaptured = core.goatsCaptured;
    this.state.selectedPieceIndex = null;
    this.state.chainCaptureTigerIndex = null;
    this.state.status = 'playing';
    this.state.winInfo = null;
    this.state.round += 1;
    this.state.rematchRequests = { host: false, guest: false };
    this.state.lastMove = null;
    this.state.roundStartedAt = now;
    this.state.currentRoundMoves = [];
  }

  public sendReaction(emoji: string) {
    const senderSide: PlayerSide | 'SPECTATOR' =
      this.role === 'host'
        ? this.state.players.host.side
        : this.role === 'guest'
        ? this.state.players.guest?.side || 'GOAT'
        : 'SPECTATOR';

    const msg: NetworkMessage = {
      type: 'REACTION',
      emoji,
      senderName: this.localName,
      senderSide,
    };

    if (this.role === 'host') {
      this.broadcastMessage(msg);
    } else {
      this.sendToHost(msg);
    }
  }

  private updateStatus(status: ConnectionStatus, errorMsg?: string) {
    this.status = status;
    this.callbacks.onStatusChange(status, errorMsg);
  }

  public getState(): RoomGameState {
    return this.state;
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    try {
      const leaveMsg: NetworkMessage = {
        type: 'LEAVE_ROOM',
        role: this.role,
        clientId: this.localClientId,
      };
      if (this.role === 'host') {
        this.broadcastMessage(leaveMsg);
      } else {
        this.sendToHost(leaveMsg);
      }
    } catch {
      // Ignore errors during teardown
    }

    if (this.guestTransport) {
      try {
        this.guestTransport.close();
      } catch {
        // Ignore
      }
    }

    this.spectatorTransports.forEach((t) => {
      try {
        t.close();
      } catch {
        // Ignore
      }
    });
    this.spectatorTransports.clear();

    if (this.hostTransport) {
      try {
        this.hostTransport.close();
      } catch {
        // Ignore
      }
    }

    if (this.bc) {
      try {
        this.bc.close();
      } catch {
        // Ignore
      }
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Actively probes a room code over BroadcastChannel + PeerJS to check if it already has 2 players
 * (including Solo vs Computer AI, Pass & Play 2-player local, or a full 2-player online room).
 */
export function probeRoomHasTwoPlayers(
  roomCode: string,
  onResult: (isFull: boolean) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase();
  if (!cleanCode) return () => {};

  let settled = false;
  let bc: BroadcastChannel | null = null;
  let peer: Peer | null = null;
  const probeClientId = `probe_${Math.random().toString(36).substring(2, 9)}`;

  const finish = (isFull: boolean) => {
    if (settled) return;
    settled = true;
    onResult(isFull);
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(`baghachheli_bc_${cleanCode}`);
      bc.onmessage = (event) => {
        const raw = event.data;
        const msg = (raw?.msg || raw) as NetworkMessage;
        if (!msg) return;
        if (msg.type === 'ROOM_PROBE_RESPONSE') {
          finish(msg.isFull);
        } else if (msg.type === 'STATE_SYNC' && msg.state?.roomCode === cleanCode) {
          finish(Boolean(msg.state.players.guest?.connected));
        }
      };
      bc.postMessage({
        senderRole: 'spectator' as NetworkRole,
        senderId: probeClientId,
        msg: {
          type: 'ROOM_PROBE',
          clientId: probeClientId,
        } satisfies NetworkMessage,
      });
    }
  } catch {
    // Ignore BroadcastChannel errors
  }

  try {
    peer = new Peer({ config: { iceServers: PEER_ICE_SERVERS } });
    peer.on('open', () => {
      if (settled || !peer) return;
      const hostPeerId = `bagha-chheli-room-${cleanCode.toLowerCase()}`;
      const conn = peer.connect(hostPeerId, { reliable: true });
      conn.on('open', () => {
        conn.send({
          type: 'ROOM_PROBE',
          clientId: probeClientId,
        } satisfies NetworkMessage);
      });
      conn.on('data', (raw) => {
        const msg = raw as NetworkMessage;
        if (!msg) return;
        if (msg.type === 'ROOM_PROBE_RESPONSE') {
          finish(msg.isFull);
          try {
            conn.close();
          } catch {
            // Ignore
          }
        } else if (msg.type === 'STATE_SYNC' && msg.state?.roomCode === cleanCode) {
          finish(Boolean(msg.state.players.guest?.connected));
        }
      });
    });
    peer.on('error', () => {
      // Ignore peer probe errors
    });
  } catch {
    // Ignore PeerJS init errors
  }

  return () => {
    settled = true;
    if (bc) {
      try {
        bc.close();
      } catch {
        // Ignore
      }
    }
    if (peer) {
      try {
        peer.destroy();
      } catch {
        // Ignore
      }
    }
  };
}


