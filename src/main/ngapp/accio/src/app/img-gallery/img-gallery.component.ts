import { Component, OnInit } from '@angular/core';
import { imageUrls } from '../images'

@Component({
  selector: 'app-img-gallery',
  templateUrl: './img-gallery.component.html',
  styleUrls: ['./img-gallery.component.css']
})
export class ImgGalleryComponent implements OnInit {
  imageUrls = imageUrls;
  constructor() { }

  ngOnInit(): void {
  }

  private uploadImage() {
    
  }
}
