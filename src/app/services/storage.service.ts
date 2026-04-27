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

  private async init() {
    try {
      this._storage = await this.storage.create();
    } catch (error) {
      console.error('Storage init error:', error);
    }
  }

  private async ensureInit(): Promise<void> {
    if (!this._storage) {
      this._storage = await this.storage.create();
    }
  }

  async saveUser(email: string, password: string): Promise<void> {
    try {
      await this.ensureInit();
      const users = await this.getUsers();
      users[email] = password;
      await this._storage?.set('users', users);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  async getUsers(): Promise<{ [key: string]: string }> {
    try {
      await this.ensureInit();
      return (await this._storage?.get('users')) || {};
    } catch (error) {
      console.error('Error getting users:', error);
      return {};
    }
  }

  async validateLogin(email: string, password: string): Promise<boolean> {
    try {
      const users = await this.getUsers();
      return users[email] === password;
    } catch (error) {
      console.error('Error validating login:', error);
      return false;
    }
  }

  async setCurrentUser(email: string): Promise<void> {
    try {
      await this.ensureInit();
      await this._storage?.set('currentUser', email);
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<string | null> {
    try {
      await this.ensureInit();
      return await this._storage?.get('currentUser');
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.ensureInit();
      await this._storage?.remove('currentUser');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  async getWatchlist(): Promise<Movie[]> {
    try {
      await this.ensureInit();
      return (await this._storage?.get('watchlist')) || [];
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  async addToWatchlist(movie: Movie): Promise<void> {
    try {
      await this.ensureInit();
      const list = await this.getWatchlist();
      const exists = list.find(m => m.imdbID === movie.imdbID);
      if (!exists) {
        list.push(movie);
        await this._storage?.set('watchlist', list);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  async removeFromWatchlist(imdbID: string): Promise<void> {
    try {
      await this.ensureInit();
      const list = await this.getWatchlist();
      const updated = list.filter(m => m.imdbID !== imdbID);
      await this._storage?.set('watchlist', updated);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  async isInWatchlist(imdbID: string): Promise<boolean> {
    try {
      const list = await this.getWatchlist();
      return list.some(m => m.imdbID === imdbID);
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  }

  async getWatchedList(): Promise<Movie[]> {
    try {
      await this.ensureInit();
      return (await this._storage?.get('watchedList')) || [];
    } catch (error) {
      console.error('Error getting watched list:', error);
      return [];
    }
  }

  async addToWatched(movie: Movie): Promise<void> {
    try {
      await this.ensureInit();
      await this.removeFromWatchlist(movie.imdbID);
      const list = await this.getWatchedList();
      const existing = list.find(m => m.imdbID === movie.imdbID);
      if (existing) {
        existing.timesWatched = (existing.timesWatched || 1) + 1;
      } else {
        movie.timesWatched = 1;
        list.push(movie);
      }
      await this._storage?.set('watchedList', list);
    } catch (error) {
      console.error('Error adding to watched list:', error);
      throw error;
    }
  }

  async removeFromWatched(imdbID: string): Promise<void> {
    try {
      await this.ensureInit();
      const list = await this.getWatchedList();
      const updated = list.filter(m => m.imdbID !== imdbID);
      await this._storage?.set('watchedList', updated);
    } catch (error) {
      console.error('Error removing from watched list:', error);
      throw error;
    }
  }

  async resetTimesWatched(imdbID: string): Promise<void> {
    try {
      await this.ensureInit();
      const list = await this.getWatchedList();
      const movie = list.find(m => m.imdbID === imdbID);
      if (movie) {
        movie.timesWatched = 0;
        await this.removeFromWatched(imdbID);
        await this.addToWatchlist(movie);
      }
    } catch (error) {
      console.error('Error resetting times watched:', error);
      throw error;
    }
  }

  async isInWatched(imdbID: string): Promise<boolean> {
    try {
      const list = await this.getWatchedList();
      return list.some(m => m.imdbID === imdbID);
    } catch (error) {
      console.error('Error checking watched list:', error);
      return false;
    }
  }
}