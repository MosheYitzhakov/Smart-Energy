import { Injectable, signal, computed, effect } from '@angular/core';
import { HE, EN, type Translations } from './translations';

export type Lang = 'he' | 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<Lang>((localStorage.getItem('lang') as Lang) ?? 'he');

  readonly lang = this._lang.asReadonly();

  readonly t = computed<Translations>(() => (this._lang() === 'he' ? HE : EN));

  constructor() {
    effect(() => {
      const translations = this.t();
      document.documentElement.dir = translations.dir;
      document.documentElement.lang = translations.lang;
      localStorage.setItem('lang', translations.lang);
    });
  }

  toggle(): void {
    this._lang.update((l) => (l === 'he' ? 'en' : 'he'));
  }

  set(lang: Lang): void {
    this._lang.set(lang);
  }
}
