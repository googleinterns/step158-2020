import { Component, OnInit } from '@angular/core';
import { imageUrls } from '../images'

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  imageUrls = imageUrls;
  constructor() { }

  ngOnInit(): void {
  }

}
