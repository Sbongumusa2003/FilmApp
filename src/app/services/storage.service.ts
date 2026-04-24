import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    this._storage = await this.storage.create();
  }

  // ─── User Auth ─────────────────────────────────────────────────────────────

  async saveUser(email: string, password: string): Promise<void> {
    const users = await this.getUsers();
    users[email] = password;
    await this._storage?.set('users', users);
  }

  async getUsers(): Promise<{ [key: string]: string }> {
    return (await this._storage?.get('users')) || {};
  }

  async userExists(email: string): Promise<boolean> {
    const users = await this.getUsers();
    return email in users;
  }

  async validateLogin(email: string, password: string): Promise<boolean> {
    const users = await this.getUsers();
    return users[email] === password;
  }

  async setCurrentUser(email: string): Promise<void> {
    await this._storage?.set('currentUser', email);
  }

  async getCurrentUser(): Promise<string | null> {
    return await this._storage?.get('currentUser');
  }

  async logout(): Promise<void> {
    await this._storage?.remove('currentUser');
  }

  async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // ─── Watchlist ──────────────────────────────────────────────────────────────

  async getWatchlist(): Promise<Movie[]> {
    return (await this._storage?.get('watchlist')) || [];
  }

  async addToWatchlist(movie: Movie): Promise<void> {
    const list = await this.getWatchlist();
    const exists = list.find(m => m.imdbID === movie.imdbID);
    if (!exists) {
      // Ensure timesWatched is cleared when adding to watchlist
      const movieToAdd = { ...movie, timesWatched: 0 };
      list.push(movieToAdd);
      await this._storage?.set('watchlist', list);
    }
  }

  async removeFromWatchlist(imdbID: string): Promise<void> {
    const list = await this.getWatchlist();
    const updated = list.filter(m => m.imdbID !== imdbID);
    await this._storage?.set('watchlist', updated);
  }

  async isInWatchlist(imdbID: string): Promise<boolean> {
    const list = await this.getWatchlist();
    return list.some(m => m.imdbID === imdbID);
  }

  // ─── Watched List ───────────────────────────────────────────────────────────

  async getWatchedList(): Promise<Movie[]> {
    return (await this._storage?.get('watchedList')) || [];
  }

  async addToWatched(movie: Movie): Promise<void> {
    // Remove from watchlist first (move operation)
    await this.removeFromWatchlist(movie.imdbID);

    const list = await this.getWatchedList();
    const existing = list.find(m => m.imdbID === movie.imdbID);
    if (existing) {
      // Increment the times watched counter
      existing.timesWatched = (existing.timesWatched || 1) + 1;
    } else {
      // First time watching — set counter to 1
      const watchedMovie = { ...movie, timesWatched: 1 };
      list.push(watchedMovie);
    }
    await this._storage?.set('watchedList', list);
  }

  async removeFromWatched(imdbID: string): Promise<void> {
    const list = await this.getWatchedList();
    const updated = list.filter(m => m.imdbID !== imdbID);
    await this._storage?.set('watchedList', updated);
  }

  /**
   * Resets the "Times Watched" counter for a movie and moves it back to the Watchlist.
   * Per assignment spec: clicking reset moves the movie back to the Watchlist.
   */
  async resetTimesWatched(imdbID: string): Promise<void> {
    const list = await this.getWatchedList();
    const movie = list.find(m => m.imdbID === imdbID);
    if (movie) {
      // Remove from watched list
      await this.removeFromWatched(imdbID);
      // Add back to watchlist with reset counter
      const resetMovie = { ...movie, timesWatched: 0 };
      await this.addToWatchlist(resetMovie);
    }
  }

  async isInWatched(imdbID: string): Promise<boolean> {
    const list = await this.getWatchedList();
    return list.some(m => m.imdbID === imdbID);
  }
}
