import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movie } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private apiUrl = `${environment.apiUrl}/movies`;
  constructor(private http: HttpClient) {}
  searchMovies(title: string): Observable<Movie[]> {
    return this.http.get<Movie[]>(`${this.apiUrl}/search?t=${encodeURIComponent(title)}`);
  }
  getMovieDetail(title: string): Observable<Movie> {
    return this.http.get<Movie>(`${this.apiUrl}/detail?t=${encodeURIComponent(title)}`);
  }
}