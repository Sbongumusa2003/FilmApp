import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { MovieService } from '../services/movie.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false,
})
export class SearchPage {
  searchQuery = '';
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  hasSearched = false;

  constructor(
    private movieService: MovieService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async searchMovies() {
    if (!this.searchQuery.trim()) return;

    const loading = await this.loadingCtrl.create({ message: 'Searching...' });
    await loading.present();

    this.movieService.searchMovies(this.searchQuery).subscribe({
      next: (data: any) => {
        this.movies = data.description || [];
        this.filteredMovies = [...this.movies];
        this.hasSearched = true;
        loading.dismiss();
      },
      error: () => {
        loading.dismiss();
        this.showToast('Failed to fetch movies. Check your connection.');
      }
    });
  }

  filterResults(event: any) {
    const val = event.target.value?.toLowerCase() || '';
    this.filteredMovies = this.movies.filter(m =>
      m['#TITLE']?.toLowerCase().includes(val)
    );
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color: 'danger' });
    toast.present();
  }
}