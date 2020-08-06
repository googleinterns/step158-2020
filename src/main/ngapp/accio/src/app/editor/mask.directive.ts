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

    // TODO(shmcaffrey): Tolerance will come from user input.
    const tolerance = 20;

    //  TODO-MASK-maskPixels needs to contain cumulative set of all pixels user clicked and added to the mask.
    // returns an array indices of each pixel in the mask.
    const maskPixels = this.magicWandService.floodfill(this.originalData, Math.floor(xCoord / this.scale), Math.floor(yCoord / this.scale), tolerance);

    // TODO(shmcaffrey): change Alpha value to incorperate user input.
    this.drawMask(maskPixels, this.scaledData, 1);
  }

  /**
   *  Creates a UI mask for the user by reading in all values in the given maskPixels.
   *  First clears the canvas so the mask can be saved as a new image and then over-
   *    lays the mask on top of the scaled image. 
   *  Adds all pixels to mask by giving alpha value of 255, changing global alpha on 
   *    maskImage will multiply 255 by globalAlpha = [0,1]
   *  @Param: maskPixels: set of coordinates indexed by red value of pixels to be in mask
   *  @Param: imgData: Uint8clampedArray of all pixel data in scaled image. 
   *  @Param: alphaValue: the number the user passes in on a slide bar for transparency of the mask
   */
  private drawMask(maskPixels: Set<number>, scaledData: ImageData, alphaValue: number): void {
    this.ctx.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    //  Reset global alpha if image was tinted:
    //    The max alpha value a pixel can hold is 255*alpha value
    //    when initialized, alpha value must start at 1 to set properly. 
    this.ctx.globalAlpha = 1;

    // Access all pixels in the original mask and add alpha value so they're visable.
    for (let pixel of maskPixels) {
      this.maskData.data[pixel + 3] = 255;
    } 
    //  Put the new img data on ctx and save as an img, ctx is already scaled so 
    //    it will scale up the mask as well.
    this.ctx.putImageData(this.maskData, 0, 0);
    const maskUrl = this.canvas.nativeElement.toDataURL();

    // Clear canvas again to prepare for image and mask.
    this.ctx.clearRect(0,0,this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  
    console.log('adding mask'); 
    this.drawImageAndMask(scaledData, maskUrl, alphaValue)
    console.log('new mask added');
  }

  /**
  * TODO(shmcaffrey): alpha change causes old mask to get darker as new pixels added.
  * Changes the alpha value of the mask displayed.
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
  * Draws the original image and updated mask on context.
  * @Param: imgData: ImageData from the original image.
  * @Param: mask: source of new mask.
  * @Param: alphaValue: the number the user passes in on a slide bar for transparency of the mask.
  */
  private drawImageAndMask(scaledData: ImageData, maskUrl: string, alphaValue: number): void {
    // Restore scaled image (scaledData).
    this.ctx.putImageData(scaledData, 0, 0);
    let maskImage = new Image();

    //TODO(shmcaffrey): alpha change causes old mask to get darker as new pixels added
    //this.ctx.globalAlpha = alphaValue;

    maskImage.onload = () => {
      this.ctx.drawImage(maskImage, 0, 0);
    };
    maskImage.src = maskUrl;
    this.maskImage = maskImage;
  }
}
