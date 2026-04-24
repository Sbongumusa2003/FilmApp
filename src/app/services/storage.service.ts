import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private _initPromise: Promise<void>;

  constructor(private storage: Storage) {
    this._initPromise = this.init();
  }

  private async init(): Promise<void> {
    this._storage = await this.storage.create();
  }

  private async ready(): Promise<void> {
    await this._initPromise;
  }

  async saveUser(email: string, password: string): Promise<void> {
    await this.ready();
    const users = await this.getUsers();
    users[email] = password;
    await this._storage!.set('users', users);
  }

  async getUsers(): Promise<{ [key: string]: string }> {
    await this.ready();
    return (await this._storage!.get('users')) || {};
  }

  async userExists(email: string): Promise<boolean> {
    await this.ready();
    const users = await this.getUsers();
    return email in users;
  }

  async validateLogin(email: string, password: string): Promise<boolean> {
    await this.ready();
    const users = await this.getUsers();
    return users[email] === password;
  }

  async setCurrentUser(email: string): Promise<void> {
    await this.ready();
    await this._storage!.set('currentUser', email);
  }

  async getCurrentUser(): Promise<string | null> {
    await this.ready();
    return await this._storage!.get('currentUser');
  }

  async logout(): Promise<void> {
    await this.ready();
    await this._storage!.remove('currentUser');
  }

  async isLoggedIn(): Promise<boolean> {
    await this.ready();
    const user = await this.getCurrentUser();
    return !!user;
  }

  async getWatchlist(): Promise<Movie[]> {
    await this.ready();
    return (await this._storage!.get('watchlist')) || [];
  }

  async addToWatchlist(movie: Movie): Promise<void> {
    await this.ready();
    const list = await this.getWatchlist();
    const exists = list.find(m => m.imdbID === movie.imdbID);
    if (!exists) {
      const movieToAdd = { ...movie, timesWatched: 0 };
      list.push(movieToAdd);
      await this._storage!.set('watchlist', list);
    }
  }

  async removeFromWatchlist(imdbID: string): Promise<void> {
    await this.ready();
    const list = await this.getWatchlist();
    const updated = list.filter(m => m.imdbID !== imdbID);
    await this._storage!.set('watchlist', updated);
  }

  async isInWatchlist(imdbID: string): Promise<boolean> {
    await this.ready();
    const list = await this.getWatchlist();
    return list.some(m => m.imdbID === imdbID);
  }


  async getWatchedList(): Promise<Movie[]> {
    await this.ready();
    return (await this._storage!.get('watchedList')) || [];
  }

  async addToWatched(movie: Movie): Promise<void> {
    await this.ready();
    await this.removeFromWatchlist(movie.imdbID);
    const list = await this.getWatchedList();
    const existing = list.find(m => m.imdbID === movie.imdbID);
    if (existing) {
      existing.timesWatched = (existing.timesWatched || 1) + 1;
    } else {
      list.push({ ...movie, timesWatched: 1 });
    }
    await this._storage!.set('watchedList', list);
  }

  async removeFromWatched(imdbID: string): Promise<void> {
    await this.ready();
    const list = await this.getWatchedList();
    const updated = list.filter(m => m.imdbID !== imdbID);
    await this._storage!.set('watchedList', updated);
  }

  async resetTimesWatched(imdbID: string): Promise<void> {
    await this.ready();
    const list = await this.getWatchedList();
    const movie = list.find(m => m.imdbID === imdbID);
    if (movie) {
      await this.removeFromWatched(imdbID);
      await this.addToWatchlist({ ...movie, timesWatched: 0 });
    }
  }

  async isInWatched(imdbID: string): Promise<boolean> {
    await this.ready();
    const list = await this.getWatchedList();
    return list.some(m => m.imdbID === imdbID);
  }
}
