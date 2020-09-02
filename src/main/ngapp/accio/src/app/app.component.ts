import { Component } from '@angular/core';
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'accio';

  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.matIconRegistry.addSvgIcon(
      'bucket_add',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/images/bucket-add.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'bucket_sub',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/images/bucket-sub.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'eraser',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/images/eraser.svg')
    );
  }
}
