import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private apiUrl = `${environment.apiUrl}/watchlist`;

  constructor(private http: HttpClient) {}

  getWatchlist(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.apiUrl);
  }

  addToWatchlist(movie: Movie): Observable<Movie> {
    return this.http.post<Movie>(this.apiUrl, movie);
  }

  /** DELETE /api/watchlist/{id} — uses primary key, not title */
  removeFromWatchlist(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class WatchedService {
  private apiUrl = `${environment.apiUrl}/watched`;

  constructor(private http: HttpClient) {}

  getWatchedList(): Observable<Movie[]> {
    return this.http.get<Movie[]>(this.apiUrl);
  }

  markAsWatched(movie: Movie): Observable<Movie> {
    return this.http.post<Movie>(this.apiUrl, movie);
  }

  updateWatched(id: number, timesWatched: number): Observable<Movie> {
    return this.http.put<Movie>(`${this.apiUrl}/${id}`, { timesWatched });
  }

  removeFromWatched(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  resetTimesWatched(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset/${id}`, {});
  }
}