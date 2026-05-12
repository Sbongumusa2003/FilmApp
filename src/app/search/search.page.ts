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
  searchQuery   = '';
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  hasSearched   = false;

  constructor(
    private movieService: MovieService,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async searchMovies() {
    if (!this.searchQuery.trim()) return;

    const loading = await this.loadingCtrl.create({ message: 'Searching...' });
    await loading.present();

    this.movieService.searchMovies(this.searchQuery).subscribe({
      next: async (data: any) => {
        this.movies         = Array.isArray(data) ? data.map(normalizeMovie) : [];
        this.filteredMovies = [...this.movies];
        this.hasSearched    = true;
        await loading.dismiss();
      },
      error: async () => {
        await loading.dismiss();
        this.showToast('Failed to fetch movies. Check your connection.', 'danger');
      }
    });
  }

  filterResults(event: any) {
    const val = event.target.value?.toLowerCase() ?? '';
    this.filteredMovies = this.movies.filter(m =>
      m.title?.toLowerCase().includes(val)
    );
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