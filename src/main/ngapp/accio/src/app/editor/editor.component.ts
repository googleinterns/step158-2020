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

  // Define urls within component.
  url;

  // inject canvas from html.
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>; 
  private ctx: CanvasRenderingContext2D;

  @ViewChild('hiddenCanvas', { static: true })
  hiddenCanvas: ElementRef<HTMLCanvasElement>; 
  private hiddenCtx: CanvasRenderingContext2D;

  //  @Param scaleFactor is used to trim image scale so image 
  //    is smaller than width and height of the users screen.
  private scaleFactor = .9;
  private image: HTMLImageElement;
  private innerHeight: number;
  private maskImageData: ImageData;

  ngOnInit() {
    this.image = new Image();
    this.innerHeight = window.innerHeight;
    // Returns url user clicked in gallery component.
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
   *    and creates a hidden canvas to store the original image 
   *    as a reference when scaling the imageUI
   * TODO(shmcaffrey): Currently, editor can require user to 
   * scroll to access the entire photo, need to make it 
   * so the editor is fixed to screen size.
   */
  private draw(): void {
    this.image.src = this.url;

    let imgWidth = this.image.width;
    let imgHeight = this.image.height;

    // Initialize hidden canvas width and height to original images width and height.
    this.hiddenCanvas.nativeElement.width = imgWidth;
    this.hiddenCanvas.nativeElement.height = imgHeight;

    // Used to scale the image to the window size, @Param scaledFactor = .9 so the scaled image is smaller than the users window.
    this.scaleFactor = Math.floor(this.innerHeight / imgHeight * this.scaleFactor);
    // TODO(shmcaffrey): add scaling if image is larger than window
    if (this.scaleFactor <= 0) {
      this.scaleFactor =  1;
    }

    // Adjust canvas to scaled image width and height, use ctx. 
    this.canvas.nativeElement.width = imgWidth * this.scaleFactor;
    this.canvas.nativeElement.height = imgHeight * this.scaleFactor;
    this.ctx.scale(this.scaleFactor, this.scaleFactor); 

    //  Initalize transparent black image data to use for mask.
    this.maskImageData = new ImageData(imgWidth,  imgHeight);
    
    this.image.onload = () => {
      this.ctx.drawImage(this.image, 0, 0, imgWidth, imgHeight);
      this.hiddenCtx.drawImage(this.image, 0, 0)
    }
  }

  /** Returns the calculated scale for the image loaded. */
  public getScaleFactor(): number {
    return this.scaleFactor;
  }

  /** Returns the original images data for reference in mask making. */
  public getOriginalImageData(): ImageData {
    return this.hiddenCtx.getImageData(0,0, this.image.width, this.image.height);
  }

  /** Returns black transparent ImageData for single mask image. */
  public getMaskImageData(): ImageData {
    return this.maskImageData;
  }

  /** Returns the scaled images data for reference printing scaled image after mask. */
  public getScaledData(): ImageData {
    return this.ctx.getImageData(0, 0, this.image.width * this.scaleFactor, this.image.height * this.scaleFactor);
  }
}
