import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private baseUrl = 'https://imdb.iamidiotareyoutoo.com/search';

  constructor(private http: HttpClient) {}

  searchMovies(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}?q=${encodeURIComponent(query)}`);
  }
}