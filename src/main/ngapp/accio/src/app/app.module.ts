import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientModule } from '@angular/common/http'
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TopBarComponent} from './top-bar/top-bar.component';
import { ImgGalleryComponent, UpdateImageDialog } from './img-gallery/img-gallery.component';
import { EditorComponent } from './editor/editor.component';
import { HomeComponent } from './home/home.component';
import { MaskDirective } from './editor/mask.directive';
import { CreateProjectComponent } from './create-project/create-project.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { LogoutComponent } from './logout/logout.component';
import { TopToolbarComponent } from './top-toolbar/top-toolbar.component';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    ImgGalleryComponent,
    EditorComponent,
    HomeComponent,
    MaskDirective,
    CreateProjectComponent,
    ToolbarComponent,
    ToolbarComponent,
    LogoutComponent,
    UpdateImageDialog,
    TopToolbarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatSliderModule,
    MatSidenavModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MaterialFileInputModule,
    MatInputModule,
    MatMenuModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    HttpClientModule,
    MatDialogModule,
    MatCheckboxModule,
    AppRoutingModule,
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}, Set],
  bootstrap: [AppComponent]
})
export class AppModule { }
