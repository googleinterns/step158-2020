import { Directive, HostListener, ElementRef, Input } from '@angular/core';
import { MagicWandService } from './magic-wand.service';

@Directive({
  selector: '[appMask]',
})
export class MaskDirective {
  @Input() scale: number;
  @Input() originalData: ImageData;
  @Input() scaledData: ImageData;
  @Input() maskData: ImageData;

  // create direct reference of canvas on editor.html
  constructor(
    private canvas: ElementRef<HTMLCanvasElement>, 
    private magicWandService: MagicWandService,
  ) { }
  private ctx: CanvasRenderingContext2D;
  private maskImage: HTMLImageElement;

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    const xCoord = e.offsetX;
    const yCoord = e.offsetY;
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // tolerance will come from user input
    const tolerance = 20;

    //  TODO-MASK-maskPixels needs to contain cumulative set of all pixels user clicked and added to the mask
    // returns an array indices of each pixel in the mask
    const maskPixels = this.magicWandService.floodfill(this.originalData, Math.floor(xCoord / this.scale), Math.floor(yCoord / this.scale), tolerance);

    // alpha value hardcoded for now
    this.drawMask(maskPixels, this.scaledData, 1);
  }

  /**
   *  Creates a UI mask to the user by reading in all values in the given maskPixels
   *  Clears the canvas fisrt so the mask can be saved as a new image and then over-
   *    lays the mask on top of the scaled image. 
   *  Adds all pixels to mask by giving alpha value of 255, changing global alpha on 
   *    maskImage will multiply 255 by globalAlpha = [0,1]
   *  @Param: maskPixels: set of coordinates indexed by red value of pixels to be in mask
   *  @Param: imgData: Uint8clampedArray of all pixel data in scaled image. 
   *  @Param: alphaValue: the number the user passes in on a slide bar for transparency of the mask
   */
  private drawMask(maskPixels: Set<number>, scaledData: ImageData, alphaValue: number): void {
    //clear old context
    this.ctx.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    //  reset global alpha if image was tinted
    this.ctx.globalAlpha = 1;

    // access all pixels in original mask, scale them up to image on UI width
    for (let pixel of maskPixels) {
      let y = this.getY(this.originalData.width, pixel);
      let x = this.getX(this.originalData.width, pixel, y);
      this.maskData.data[this.getPixel(x, y, scaledData.width) + 3] = 255;
    } 
    // Put the new img data on ctx and save as an img
    this.ctx.putImageData(this.maskData, 0, 0);
    
    const maskUrl = this.canvas.nativeElement.toDataURL();

    // clear canvas again to prepare for image and mask
    this.ctx.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  
    console.log('adding mask'); 
    this.drawImageAndMask(scaledData, maskUrl, alphaValue)
    console.log('new mask added');
  }

  /**
  * TODO: alpha change causes old mask to get darker as new pixels added
  * Changes the alpha value of the mask displayed 
  * @Param: alphaValue: the number the user passes in on a slide bar for transparency of the mask
  */
  private changeAlpha(alphaValue: number): void {
    if (alphaValue == 0) {
      alphaValue = .01;
    }
    this.ctx.globalAlpha = alphaValue;
    var newMask = new Image();
    newMask.src = this.maskImage.src;
    newMask.onload = () => {
        this.ctx.drawImage(newMask, 0, 0);
    };
  }

  /**
  * draws the original image and updated mask on context
  * @Param: imgData: ImageData from the original image
  * @Param: mask: source of new mask 
  * @Param: alphaValue: the number the user passes in on a slide bar for transparency of the mask
  */
  private drawImageAndMask(scaledData: ImageData, maskUrl: string, alphaValue: number): void {
    // restore original image (scaledData)
    this.ctx.putImageData(scaledData, 0, 0);

    //make a new image to add
    let maskImage = new Image();

    //TODO: alpha change causes old mask to get darker as new pixels added
    //this.ctx.globalAlpha = alphaValue;

    maskImage.onload = () => {
      this.ctx.drawImage(maskImage, 0, 0);
    };
    maskImage.src = maskUrl;
    this.maskImage = maskImage;
  }

  /** 
   * Reverses pixel index from floodfill set to get y index
   * @Param: width: width of the original image
   * @Param: pixel: pixel index in from the returned floodfill mask
   */
  private getY(width: number, pixel: number): number {
    return Math.floor(pixel / (width*4));
  }

  /** 
   * Reverses pixel index from floodfill set to get y index
   * @Param: width: width of the original image
   * @Param: pixel: pixel index in from the returned floodfill mask
   * @Param: y: y value from this.getY();
   */
  private getX(width: number, pixel: number, y: number): number {
    return (pixel / 4) - (y * width);
  }

  /** 
  * Convert coord [@x, @y] (2-D) to indexing style of DataArray (1-D)
  * Returns index of start of pixel at @x, @y
  * (which represents the red attribute of that pixel)
  * Important: Returns array of number representing indices.
  */
  private getPixel(x: number, y: number, width: number): number {
    return (x + (y * width)) * 4;
  }
}
