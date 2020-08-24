import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FetchImagesService {

  constructor() { }

  private imageArray = new BehaviorSubject<Array<any>>(new Array<any>());
  currentImages = this.imageArray.asObservable();

 /**
  * Fetches images from servlet based on URL and stores in service.
  */
  async changeImages(fetchUrl: string): Promise<void> {
    const response = await fetch(fetchUrl);
    console.log('fetchurl: ' + fetchUrl);
    const imageContent = await response.json();
    this.imageArray.next(imageContent);
  }
}
