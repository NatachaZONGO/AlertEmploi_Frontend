import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaysUtilsService {

  /**
   * Convertir le code ISO en emoji drapeau
   */
  getFlagEmoji(code: string): string {
    if (!code || code.length !== 2) return '🌍';
    
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  }

  /**
   * Formater l'affichage d'un pays avec drapeau
   */
  formatPaysDisplay(pays: { nom: string; code: string }): string {
    return `${this.getFlagEmoji(pays.code)} ${pays.nom} (${pays.code})`;
  }

  /**
   * Obtenir le label HTML pour un dropdown
   */
  getPaysLabel(pays: { nom: string; code: string }): string {
    return `${this.getFlagEmoji(pays.code)} ${pays.nom}`;
  }
}