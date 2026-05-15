import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie, normalizeMovie } from '../models/movie.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false
})
export class SearchPage {
  searchQuery = '';
  movies: Movie[] = [];
  hasSearched = false;
  isLoading   = false;

  constructor(
    private movieService: MovieService,
    private authService:  AuthService,
    private router:       Router,
    private loadingCtrl:  LoadingController,
    private toastCtrl:    ToastController
  ) {}

  async searchMovies() {
    const query = this.searchQuery.trim();
    if (!query || this.isLoading) return;

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Searching...' });
    await loading.present();

    this.movieService.searchMovies(query).subscribe({
      next: async (data: any) => {
        this.movies      = Array.isArray(data) ? data.map(normalizeMovie) : [];
        this.hasSearched = true;
        this.isLoading   = false;
        await loading.dismiss();
      },
      error: async (err) => {
        this.isLoading = false;
        await loading.dismiss();
        const msg = err?.error?.message ?? 'Failed to fetch movies. Check your connection.';
        this.showToast(msg, 'danger');
      }
    });
  }

  onSearchbarKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') this.searchMovies();
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  async showToast(msg: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color });
    toast.present();
  }
}