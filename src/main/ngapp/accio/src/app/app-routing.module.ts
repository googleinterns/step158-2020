import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImgGalleryComponent } from './img-gallery/img-gallery.component';
import { LogoutComponent } from './logout/logout.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';
import { TopBarComponent } from './top-bar/top-bar.component';

const routes: Routes = [
  { path: 'img-gallery', component: ImgGalleryComponent },
  { path: 'img-gallery/:proj-id', component: ImgGalleryComponent },
  { path: 'editor/:proj-id /:parent-img /:imgUrl /:index', component: EditorComponent },
  { path: 'editor/:proj-id /:parent-img /:imgUrl /:mask-parent /:mask-parent-url', component: EditorComponent },
  { path: 'logout', component: LogoutComponent},
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: ':buttonLink', component: TopBarComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
