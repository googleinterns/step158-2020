import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GalleryComponent } from './gallery/gallery.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: 'gallery', component: GalleryComponent },
  { path: 'editor/:imgUrl', component: EditorComponent },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
