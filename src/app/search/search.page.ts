import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { MovieService } from '../services/movie.service';
import { StorageService } from '../services/storage.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false,
})
export class SearchPage {
  searchQuery = '';
  filterQuery = '';
  lastQuery = '';
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  hasSearched = false;
  isLoading = false;

  constructor(
    private movieService: MovieService,
    private storageService: StorageService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async searchMovies() {
    if (!this.searchQuery.trim()) {
      this.showToast('Please enter a search term.');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({ message: 'Searching...' });
    await loading.present();

    this.movieService.searchMovies(this.searchQuery).subscribe({
      next: (data: any) => {
        this.movies = data.description || [];
        this.filteredMovies = [...this.movies];
        this.hasSearched = true;
        this.lastQuery = this.searchQuery;
        this.filterQuery = '';
        this.isLoading = false;
        loading.dismiss();

        if (this.movies.length === 0) {
          this.showToast('No results found for "' + this.searchQuery + '"');
        }
      },
      error: () => {
        this.isLoading = false;
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

  clearSearch() {
    this.searchQuery = '';
    this.filterQuery = '';
    this.movies = [];
    this.filteredMovies = [];
    this.hasSearched = false;
  }

  goToDetail(movie: Movie) {
    this.router.navigate(['/movie-detail'], { state: { movie } });
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Log Out',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log Out',
          role: 'destructive',
          handler: async () => {
            await this.storageService.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: 'danger'
    });
    toast.present();
  }
}
