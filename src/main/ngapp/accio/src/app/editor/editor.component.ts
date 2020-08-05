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
  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  // Define urls within component
  url;

  // inject canvas from html
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>; 
  private ctx: CanvasRenderingContext2D;

  @ViewChild('hiddenCanvas', { static: true })
  hiddenCanvas: ElementRef<HTMLCanvasElement>; 
  private hiddenCtx: CanvasRenderingContext2D;

  private innerHeight: number;
  //  To trim image scale so image is smaller than width and height.
  private scaleFactor = .9
  image = new Image();

  ngOnInit() {
    this.innerHeight = window.innerHeight;
    //returns url user clicked in gallery component
    this.route.paramMap.subscribe(params => {
      let index = Number(params.get('imgUrl'));
      this.checkImageUrl(index);
      this.url = imageUrls[index];
    });

    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.hiddenCtx = this.hiddenCanvas.nativeElement.getContext('2d');
    this.draw();
  }   
  
  /**
   * Checks that route for editor URL is in bounds of array of Urls and is a number
   * Redirects to gallery component if not, does not complete editor component
   * index: the route from the editor url passed through gallery.ts 
   */
  private checkImageUrl(index: number): void {
    if (Number.isNaN(index) || index >= imageUrls.length || index < 0) {    
      console.log('Index: ' + index + 'Not a number or greater than number of images, returning to Gallery');
      this.router.navigate(['/gallery']);
    }
  }
  /**  
   * Draws the image user selects from gallery on Canvas
   * Currently, editor can require user to scroll to access
   * the entire photo, need to make it so the editor is 
   * fixed to screen size
   */
  private draw(): void {
    this.image.src = this.url;

    //init hidden canvas width to original images width and height
    this.hiddenCanvas.nativeElement.width = this.image.width;
    this.hiddenCanvas.nativeElement.height = this.image.height;

    // used to scale the image to the window size, 1.2 so the image is smaller than the window.
    this.scaleFactor = Math.floor(this.innerHeight / this.image.height * this.scaleFactor);
    // TO DO: add scaling if image is larger than window
    if (this.scaleFactor <= 0) {
      this.scaleFactor =  1;
    }

    //adjust canvas to image width and height, use stx. scale to show the image larger than it is. 
    this.canvas.nativeElement.width = this.image.width * this.scaleFactor;
    this.canvas.nativeElement.height = this.image.height * this.scaleFactor;

    this.ctx.scale(this.scaleFactor, this.scaleFactor); 
    
    this.image.onload = () => {
      this.ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
      this.hiddenCtx.drawImage(this.image, 0, 0)
    }
  }

  /** returns the calculated scale for the image loaded */
  public getScaleFactor(): number {
    return this.scaleFactor;
  }

  /** returns the original images data for reference in mask making */
  public getImgData(): ImageData {
    return this.hiddenCtx.getImageData(0,0, this.image.width, this.image.height);
  }

}
