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

  paintPixels: Set<number>;
  mouseDown: boolean = false;

  //  Create direct reference of canvas on editor.html
  constructor(
    private canvas: ElementRef<HTMLCanvasElement>, 
    private magicWandService: MagicWandService,
  ) { }

  /** 
   *  Listens for user interaction on 'appMask' - the  canvas visual to the user.
   *  When clicked, records the x and y offset, retrieves the tolerance and calls the 
   *  floodfill algorithm. Directive is a child of editor, so when the new set mask is 
   *  created, the pixels are emitted to the editor.
   */ 
  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    if(!this.disableFloodFill && this.tool == MaskTool.magicWand) {
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
    else {
      console.log('Flood Fill disabled, select flood fill tool');
    }
  }

/**
 * Listens for user mousedown on 'appMask'. When user mouse goes down
 * It initialized the set and paints the single pixel. 
 */
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if (this.tool == MaskTool.paint) {
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
    if (this.tool == MaskTool.paint && this.mouseDown) {
      const xCoord = e.offsetX;
      const yCoord = e.offsetY;

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

 /** executes once user releases mouse and calls scribble flood fill or 
  *   Calls function to add added pixels to the master set of mask pixels.
  */
  @HostListener('mouseup', ['$event']) 
  onMouseUp(e: MouseEvent) {
    if (this.tool == MaskTool.paint) {
      this.mouseDown = false;

      //  If user has Magic wand selected, call Scribble flood fill.
      //  If user has paint selected, call paint to add pixels painted to master.
    }
  }
}
