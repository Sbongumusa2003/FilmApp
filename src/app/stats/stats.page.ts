import { Component, OnInit } from '@angular/core';
import { WatchedService } from '../services/list.service';
import { Movie } from '../models/movie.model';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: false
})
export class StatsPage implements OnInit {
  totalWatched = 0;
  totalTimesWatched = 0;
  topMovie: Movie | null = null;

  constructor(private watchedService: WatchedService) {}

  ngOnInit() {
    this.loadStats();
  }

  ionViewWillEnter() {
    this.loadStats();
  }

  loadStats() {
    this.watchedService.getWatchedList().subscribe({
      next: (movies) => {
        this.totalWatched = movies.length;
        this.totalTimesWatched = movies.reduce((sum, m) => sum + (m.timesWatched || 0), 0);
        this.topMovie = movies.sort((a, b) => (b.timesWatched || 0) - (a.timesWatched || 0))[0] || null;
      }
    });
  }
}