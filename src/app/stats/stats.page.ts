import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { WatchedService } from '../services/list.service';
import { MovieService } from '../services/movie.service';
import { AuthService } from '../services/auth.service';
import { Movie } from '../models/movie.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Chart from 'chart.js/auto';

interface GenreRow {
  genre: string;
  count: number;
}

@Component({
  selector:    'app-stats',
  templateUrl: './stats.page.html',
  styleUrls:   ['./stats.page.scss'],
  standalone:  false
})
export class StatsPage implements OnDestroy {

  public readonly GENRE_COLORS: string[] = [
    '#e50914', '#ff9f40', '#4bc0c0',
    '#9966ff', '#36a2eb', '#ffcd56',
    '#c9cbcf', '#ff6384', '#2ecc71', '#e67e22'
  ];

  totalMovies = 0;
  totalViews  = 0;
  avgViews    = '0';
  topMovies: Movie[]     = [];
  genreRows: GenreRow[]  = [];
  top6Genres: GenreRow[] = [];

  isLoading   = true;
  isEnriching = false;

  private maxGenreCount = 1;
  private pieChart: Chart | null = null;
  private barChart: Chart | null = null;

  constructor(
    private watchedService: WatchedService,
    private movieService:   MovieService,
    private authService:    AuthService,
    private router:         Router,
    private toastCtrl:      ToastController
  ) {}

  ngOnDestroy() {
    this.destroyCharts();
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  ionViewDidEnter() {
    if (!this.isLoading) {
      if (this.top6Genres.length > 0) this.createPieChart(this.top6Genres);
      if (this.topMovies.length > 0)  this.createBarChart(this.topMovies);
    }
  }

  private destroyCharts() {
    if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }
    if (this.barChart) { this.barChart.destroy(); this.barChart = null; }
  }

  loadStats() {
    this.isLoading   = true;
    this.isEnriching = false;
    this.totalMovies = 0;
    this.totalViews  = 0;
    this.avgViews    = '0';
    this.topMovies   = [];
    this.genreRows   = [];
    this.top6Genres  = [];
    this.destroyCharts();

    this.watchedService.getWatchedList().subscribe({
      next: movies => {
        const missingGenre = movies.filter(m => !m.genre || m.genre.trim() === '');

        if (missingGenre.length === 0) {
          this.buildAndRender(movies);
        } else {
          this.isEnriching = true;
          const enrichRequests = missingGenre.map(m =>
            this.movieService.getMovieDetail(m.title).pipe(
              map(detail => ({ imdbID: m.imdbID, genre: detail?.genre ?? '' })),
              catchError(() => of({ imdbID: m.imdbID, genre: '' }))
            )
          );

          forkJoin(enrichRequests).subscribe({
            next: enriched => {
              const enrichMap = new Map(enriched.map(e => [e.imdbID, e.genre]));
              const enrichedMovies = movies.map(m => ({
                ...m,
                genre: (m.genre && m.genre.trim() !== '')
                  ? m.genre
                  : (enrichMap.get(m.imdbID) ?? '')
              }));
              this.isEnriching = false;
              this.buildAndRender(enrichedMovies);
            },
            error: () => {
              this.isEnriching = false;
              this.buildAndRender(movies);
            }
          });
        }
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Failed to load statistics.', 'danger');
      }
    });
  }

  private buildAndRender(movies: Movie[]) {
    this.buildStats(movies);
    this.isLoading = false;
    setTimeout(() => {
      if (this.top6Genres.length > 0) this.createPieChart(this.top6Genres);
      if (this.topMovies.length > 0)  this.createBarChart(this.topMovies);
    }, 200);
  }

  private buildStats(movies: Movie[]) {
    this.totalMovies = movies.length;
    this.totalViews  = movies.reduce((sum, m) => sum + (m.timesWatched ?? 1), 0);
    this.avgViews    = this.totalMovies > 0
      ? (this.totalViews / this.totalMovies).toFixed(1) : '0';

    const genreMap = new Map<string, number>();
    for (const movie of movies) {
      if (!movie.genre) continue;
      movie.genre.split(',').map(g => g.trim()).filter(g => g).forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) ?? 0) + 1);
      });
    }

    const sorted: GenreRow[] = [...genreMap.entries()]
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    this.genreRows     = sorted;
    this.top6Genres    = sorted.slice(0, 6);
    this.maxGenreCount = sorted[0]?.count ?? 1;

    this.topMovies = [...movies]
      .sort((a, b) => (b.timesWatched ?? 1) - (a.timesWatched ?? 1))
      .slice(0, 10);
  }

  private createPieChart(top6: GenreRow[]) {
    const canvas = document.getElementById('genrePieChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }

    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: top6.map(r => r.genre),
        datasets: [{
          data:            top6.map(r => r.count),
          backgroundColor: top6.map((_, i) => this.GENRE_COLORS[i % this.GENRE_COLORS.length]),
          borderColor:     '#1a1a1a',
          borderWidth:     2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#ccc', font: { size: 12 }, padding: 12, boxWidth: 14 }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const val   = ctx.parsed as number;
                const pct   = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: ${val} movie${val !== 1 ? 's' : ''} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  private createBarChart(movies: Movie[]) {
    const canvas = document.getElementById('moviesBarChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.barChart) { this.barChart.destroy(); this.barChart = null; }

    const labels = movies.map(m =>
      m.title.length > 20 ? m.title.substring(0, 20) + '…' : m.title
    );
    const data   = movies.map(m => m.timesWatched ?? 1);
    const max    = Math.max(...data, 1);
    const colors = data.map(v => {
      const pct = v / max;
      if (pct >= 0.75) return '#e50914';
      if (pct >= 0.50) return '#ff9f40';
      if (pct >= 0.25) return '#ffcd56';
      return '#36a2eb';
    });

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label:           'Times Watched',
          data,
          backgroundColor: colors,
          borderRadius:    6,
          borderSkipped:   false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.x}x watched`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: Math.max(max + 1, 3),
            ticks: {
              color:     '#666',
              font:      { size: 11 },
              stepSize:  1,
              precision: 0
            },
            grid: { color: '#2a2a2a' }
          },
          y: {
            ticks: { color: '#aaa', font: { size: 12 } },
            grid:  { display: false }
          }
        }
      }
    });
  }

  tableBarWidth(count: number): number {
    return this.maxGenreCount === 0 ? 0 : Math.round((count / this.maxGenreCount) * 100);
  }

  truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max) + '…' : text;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async showToast(msg: string, color = 'danger') {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2000, color });
    toast.present();
  }
}