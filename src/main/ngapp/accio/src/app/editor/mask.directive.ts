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

  //  Set containing pixels converted to their red index in ImageData. Used for paint and scribble
  paintPixels: Set<number>;
  mouseDown: boolean = false;
  //  Determines if the user moved after they clicked, and does scribble fill instead of flood. 
  scribbleFill: boolean = false;

  //  Initial x&y coords.
  private xCoord: number;
  private yCoord: number;

  //  Create direct reference of canvas on editor.html
  constructor(
    private canvas: ElementRef<HTMLCanvasElement>, 
    private magicWandService: MagicWandService,
  ) { }

/**
 *  Listens for user mousedown on 'appMask'. When user mouse goes down.
 *  Initializes the 'paintPixels' set and paints a single pixel when the user presses the mouse.
 */
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if (this.tool == MaskTool.PAINT
        || this.tool == MaskTool.ERASE
        || this.tool == MaskTool.MAGIC_WAND_ADD
        || this.tool == MaskTool.MAGIC_WAND_SUB)  {

      this.xCoord = e.offsetX;
      this.yCoord = e.offsetY;

      this.mouseDown = true;
      this.paintPixels = new Set<number>();

      //  Get pixel of original image that user clicked on.
      let pixel = this.magicWandService.coordToDataArrayIndex(
        Math.floor(this.xCoord / this.scale),
        Math.floor(this.yCoord / this.scale), 
        this.originalImageData.width);
      
      //  Add pixel to set for scribble fill or for master pixel list.       
      this.paintPixels.add(pixel);

      console.log('drawing pixel mousedown');
      // Fire event to draw pixel
      this.newPaintEvent.emit(pixel);

    }
  }

  /** 
   *  Listens for mouse movement over appMask, executes if user's mouse is clicked.
   *  For each movement, the pixel is added to the paintPixels set and then painted 
   *    on the canvas.
   */
  @HostListener('mousemove', ['$event'])  
  onMouseMove(e: MouseEvent) {
    if ((this.tool == MaskTool.PAINT 
        || this.tool == MaskTool.ERASE 
        || this.tool == MaskTool.MAGIC_WAND_ADD 
        || this.tool == MaskTool.MAGIC_WAND_SUB) 
        && this.mouseDown) {

      const xCoord = e.offsetX;
      const yCoord = e.offsetY;
      //  TODO: IF USER MOVES OFF CANVAS TREAT IT AS

      console.log('offset: ' + xCoord);
      console.log('offset: ' + e.clientX);
    
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
  *  Executes once user releases mouse 
  *  Calls magic-wand.service paint/scribbleFloodFill/floodFill function
  *    depending on what tool is selected and if the user moved the mouse or not. 
  *  If normal floodFill, then records the x and y offset, retrieves the tolerance and calls the 
  *    floodfill algorithm. 
  *  If the user moved the mouse before picking up their mouse, then floodFill does not execute.
  *    scribble is called instead with @param paintPixels.
  */ 
  @HostListener('mouseup', ['$event']) 
  onMouseUp(e: MouseEvent) {
      this.mouseDown = false;
    //  If user has paint selected, call paint to add pixels painted to master.
    if (this.tool == MaskTool.PAINT || this.tool == MaskTool.ERASE) {
      this.scribbleFill = false;
      //  TODO: call to save pixels painted in mask once function implemented

    }
    //  If user has Magic wand selected and they moved the mouse, call scribbleFlood Fill.
    else if ((this.tool == MaskTool.MAGIC_WAND_ADD
        || this.tool == MaskTool.MAGIC_WAND_SUB) 
        && this.scribbleFill) {

      this.scribbleFill = false;
      //  TODO: uncomment once scribble flood fill implemented
      const maskPixels = this.magicWandService.scribbleFloodfill(
        this.originalImageData,
        Math.floor(this.xCoord / this.scale), 
        Math.floor(this.yCoord / this.scale), 
        this.tolerance, 
        this.paintPixels);

      this.newMaskEvent.emit(maskPixels);
    }

    else if ((this.tool == MaskTool.MAGIC_WAND_ADD
        || this.tool == MaskTool.MAGIC_WAND_SUB) 
        && !this.scribbleFill) {

      console.log('tolerace in mask.dr ' + this.tolerance);
      
      //  Returns an array indices of each pixel in the mask.
      const maskPixels = this.magicWandService.floodfill(
        this.originalImageData, 
        Math.floor(this.xCoord / this.scale), 
        Math.floor(this.yCoord / this.scale), 
        this.tolerance);

      this.newMaskEvent.emit(maskPixels);
    }
  }
}
