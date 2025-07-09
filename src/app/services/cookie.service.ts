import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private readonly CONSENT_KEY = 'cookie_consent';

  constructor() {}

  hasConsent(): boolean {
    return localStorage.getItem(this.CONSENT_KEY) === 'true';
  }

  setConsent(consent: boolean): void {
    localStorage.setItem(this.CONSENT_KEY, consent.toString());
  }

  getConsent(): boolean {
    return this.hasConsent();
  }

  clearConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
  }
}