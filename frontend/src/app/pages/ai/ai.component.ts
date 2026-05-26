import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { I18nService } from '../../core/i18n/i18n.service';
import { environment } from '../../../environments/environment';

interface AIOutput {
  explanation: string;
  recommendation: string;
  stale: boolean;
  generatedAt: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

@Component({
  selector: 'app-ai',
  imports: [
    FormsModule,
    RouterModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai.component.html',
  styleUrl: './ai.component.scss',
})
export class AIComponent implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly http = inject(HttpClient);

  @ViewChild('chatBottom') chatBottom!: ElementRef<HTMLDivElement>;

  readonly insight = signal<AIOutput | null>(null);
  readonly insightLoading = signal(false);
  readonly messages = signal<ChatMessage[]>([]);
  readonly thinking = signal(false);
  question = '';

  async ngOnInit(): Promise<void> {
    await this.loadInsight();
  }

  async loadInsight(): Promise<void> {
    this.insightLoading.set(true);
    try {
      const result = await firstValueFrom(
        this.http.get<AIOutput>(`${environment.apiUrl}/ai/insight`),
      );
      this.insight.set(result);
    } catch {
      this.insight.set(null);
    } finally {
      this.insightLoading.set(false);
    }
  }

  async sendMessage(): Promise<void> {
    const q = this.question.trim();
    if (!q || this.thinking()) return;

    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date().toISOString() };
    this.messages.update((prev) => [...prev, userMsg]);
    this.question = '';
    this.thinking.set(true);
    this.scrollBottom();

    try {
      const history = this.messages().slice(0, -1); // exclude last user msg (we pass it as question)
      const res = await firstValueFrom(
        this.http.post<{ answer: string }>(`${environment.apiUrl}/ai/chat`, {
          history,
          question: q,
        }),
      );
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toISOString(),
      };
      this.messages.update((prev) => [...prev, assistantMsg]);
    } catch {
      this.messages.update((prev) => [
        ...prev,
        { role: 'assistant', content: 'אירעה שגיאה. נסה שוב.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      this.thinking.set(false);
      this.scrollBottom();
    }
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.sendMessage();
    }
  }

  private scrollBottom(): void {
    setTimeout(() => this.chatBottom?.nativeElement.scrollIntoView({ behavior: 'smooth' }), 50);
  }
}
