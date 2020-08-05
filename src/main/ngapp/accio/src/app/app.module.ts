import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TopBarComponent} from './top-bar/top-bar.component';
import { ImgGalleryComponent } from './img-gallery/img-gallery.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';
import { MaskDirective } from './mask.directive';
import { ToolbarComponent } from './toolbar/toolbar.component';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    ImgGalleryComponent,
    EditorComponent,
    HomeComponent,
    MaskDirective,
    ToolbarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
