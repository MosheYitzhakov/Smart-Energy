import { Injectable, OnDestroy, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { EnergyStore } from '../../store/energy.store';
import type { EnergyReading, AnomalyResult } from '../../shared/models/contracts';

const STALE_THRESHOLD_MS = 10_000;
const BACKOFF_STEPS_MS = [1000, 2000, 4000, 8000, 15000, 30000];

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffIndex = 0;
  private destroyed = false;

  private readonly auth = inject(AuthService);
  private readonly store = inject(EnergyStore);

  connect(): void {
    if (this.socket?.connected) return;
    this.destroyed = false;
    this._open();
  }

  disconnect(): void {
    this.destroyed = true;
    this._clearTimers();
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private _open(): void {
    this.socket?.disconnect();

    this.socket = io(environment.apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: false, // manual backoff for full control
    });

    this.socket.on('connect', () => {
      this.backoffIndex = 0;
      const token = this.auth.getToken();
      if (token) this.socket!.emit('join', { token });
      this._resetStaleTimer();
    });

    this.socket.on('energy.update', (reading: EnergyReading) => {
      this.store.pushReading(reading);
      this._resetStaleTimer();
    });

    this.socket.on('alert', (anomaly: AnomalyResult) => {
      this.store.pushAlert(anomaly);
    });

    this.socket.on('disconnect', () => {
      if (!this.destroyed) {
        this.store.markStale();
        this._scheduleReconnect();
      }
    });

    this.socket.on('connect_error', () => {
      if (!this.destroyed) {
        this.store.markStale();
        this._scheduleReconnect();
      }
    });
  }

  private _resetStaleTimer(): void {
    if (this.staleTimer !== null) clearTimeout(this.staleTimer);
    this.store.markFresh();
    this.staleTimer = setTimeout(() => {
      this.store.markStale();
    }, STALE_THRESHOLD_MS);
  }

  private _scheduleReconnect(): void {
    if (this.destroyed) return;
    this._clearTimers();
    const delay = BACKOFF_STEPS_MS[Math.min(this.backoffIndex, BACKOFF_STEPS_MS.length - 1)]!;
    this.backoffIndex++;
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this._open();
    }, delay);
  }

  private _clearTimers(): void {
    if (this.staleTimer !== null) { clearTimeout(this.staleTimer); this.staleTimer = null; }
    if (this.reconnectTimer !== null) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }
}
