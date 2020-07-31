import { Component, OnInit } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
  ) { }

  ngOnInit() {
    //returns url user clicked in gallery component
    this.route.paramMap.subscribe(params => {
      this.url = imageUrls[+params.get('imgUrl')];

     this.ctx = this.canvas.nativeElement.getContext('2d');
     this.draw();
    });
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
