import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImgGalleryComponent } from './img-gallery/img-gallery.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: 'img-gallery', component: ImgGalleryComponent },
  { path: 'editor/:imgUrl', component: EditorComponent },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
