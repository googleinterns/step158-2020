import { Directive, HostListener, ElementRef, Input, SimpleChanges } from '@angular/core';
import { MagicWandService } from './magic-wand.service';
import { Output, EventEmitter } from '@angular/core';
import { MaskTool } from './MaskToolEnum';

@Directive({
  selector: '[appMask]',
})
export class MaskDirective {
  //  ImageData from image user selects, drawn at real scale.
  @Input() originalImageData: ImageData;
  @Input() scale: number;
  @Input() tolerance: number;
  @Input() disableFloodFill: boolean;
  @Input() tool: MaskTool;

  @Output() newMaskEvent = new EventEmitter<Set<number>>();
  @Output() newPaintEvent = new EventEmitter<number>();

  //  Set containing pixels converted to theit red index in ImageData. Used for paint and scribble
  paintPixels: Set<number>;
  mouseDown: boolean = false;
  //  Determines if the user moved after they clicked, and does scribble fill instead of flood. 
  scribbleFill: boolean = false;

  //  Create direct reference of canvas on editor.html
  constructor(
    private canvas: ElementRef<HTMLCanvasElement>, 
    private magicWandService: MagicWandService,
  ) { }

/**
 * Listens for user mousedown on 'appMask'. When user mouse goes down
 * It initialized the set and paints the single pixel. 
 */
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if (this.tool == MaskTool.paint || this.tool == MaskTool.magicWand) {
      const xCoord = e.offsetX;
      const yCoord = e.offsetY;


      this.mouseDown = true;
      this.paintPixels = new Set<number>();

      //  Get pixel of original image that user clicked on.
      let pixel = this.magicWandService.coordToDataArrayIndex(
        Math.floor(xCoord / this.scale),
        Math.floor(yCoord / this.scale), 
        this.originalImageData.width);
      
      //  Add pixel to set for scribble fill or for master pixel list.       
      this.paintPixels.add(pixel);

      console.log('drawing pixel mousedown');
      // Fire event to draw pixel
      this.newPaintEvent.emit(pixel);

    }
  }

  /** 
   *  Listens for mouse movment over appMask, executes if user's mouse is clicked.
   *  For each movement, the pixel is added to the paintPixels set and then painted 
   *    on the canvas.
   */
  @HostListener('mousemove', ['$event'])  
  onMouseMove(e: MouseEvent) {
    if ((this.tool == MaskTool.paint || this.tool == MaskTool.magicWand) && this.mouseDown) {
      const xCoord = e.offsetX;
      const yCoord = e.offsetY;

      //  User moved mouse, use scribble fill. 
      this.scribbleFill = true;

      //  Get pixel of user moved over.
      let pixel = this.magicWandService.coordToDataArrayIndex(
        Math.floor(xCoord / this.scale),
        Math.floor(yCoord / this.scale), 
        this.originalImageData.width);

      this.paintPixels.add(pixel);

      console.log('drawing pixel mousemove');
      //  Fire event to draw pixel
      this.newPaintEvent.emit(pixel);
    }
  }

 /** 

  *  Sends class @param paintPixels of pixels user painted to magic-wand.service
  */

 /** 
  *  Executes once user releases mouse 
  *  Calls magic-wand.service paint/scribbleFloodFill/floodFill function
  *    depending on what tool is selected and if the user moved the mouse or not. 
  *  If normal floodFill, then records the x and y offset, retrieves the tolerance and calls the 
  *    floodfill algorithm. 
  *  If the user moved the mouse before picking up their mouse, then floodFill does not execute.
   *  Scribble is called instead. 
   */ 
  @HostListener('mouseup', ['$event']) 
  onMouseUp(e: MouseEvent) {
      this.mouseDown = false;
    //  If user has paint selected, call paint to add pixels painted to master.
    if (this.tool == MaskTool.paint) {
      this.scribbleFill = false;

    }
    //  If user has Magic wand selected and they moved the mouse, call scribbleFlood Fill.
    else if (this.tool == MaskTool.magicWand && this.scribbleFill) {
      // no longer scribble fill
      this.scribbleFill = false;
    }
    else if (this.tool == MaskTool.magicWand && !this.scribbleFill) {
      const xCoord = e.offsetX;
      const yCoord = e.offsetY;

      console.log('tolerace in mask.dr ' + this.tolerance);
      
      //  Returns an array indices of each pixel in the mask.
      const maskPixels = this.magicWandService.floodfill(
        this.originalImageData, 
        Math.floor(xCoord / this.scale), 
        Math.floor(yCoord / this.scale), 
        this.tolerance);

      this.newMaskEvent.emit(maskPixels);
    }
  }
}
