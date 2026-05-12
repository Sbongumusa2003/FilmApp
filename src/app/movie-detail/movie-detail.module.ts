import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { MovieDetailPage } from './movie-detail.page';

const routes: Routes = [{ path: '', component: MovieDetailPage }];

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [MovieDetailPage]
})
export class MovieDetailPageModule {}