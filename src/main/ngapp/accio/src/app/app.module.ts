import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TopBarComponent} from './top-bar/top-bar.component';
import { GalleryComponent } from './gallery/gallery.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';
import { MaskDirective } from './mask.directive';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    GalleryComponent,
    EditorComponent,
    HomeComponent,
    MaskDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
