import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { imageUrls } from '../images';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  // Define urls within component
  url;

  // inject canvas from html
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>; 
  private ctx: CanvasRenderingContext2D;
  image = new Image();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    //returns url user clicked in gallery component
    this.route.paramMap.subscribe(params => {
      let index = Number(params.get('imgUrl'));
      this.checkImageUrl(index);
      this.url = imageUrls[index];
    });

    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.draw();
  }  
  
  //  Checks that route for editor URL is in bounds of array of Urls and is a number
  //  Redirects to gallery component if not
  private checkImageUrl(index: number) {
    if (Number.isNaN(index) || index >= imageUrls.length) {    
      console.log('Index: ' + index + 'Not a number or greater than number of images, returning to Gallery');
      this.router.navigate(['/gallery']);
    }
  }
  
  // Draws the image user selects from gallery on Canvas
  // Currently, editor can require user to scroll to access
  //  the entire photo, need to make it so the editor is 
  //  fixed to screen size
  private draw() {
    this.image.src = this.url;

    //adjust canvas to image width and height
    this.canvas.nativeElement.width = this.image.width;
    this.canvas.nativeElement.height = this.image.height;
    
    this.image.onload = () => {
      this.ctx.drawImage(this.image, 0, 0);
    }
  }
}
