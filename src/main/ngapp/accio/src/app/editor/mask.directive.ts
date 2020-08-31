import {
  Directive,
  HostListener,
  ElementRef,
  Input,
  SimpleChanges,
} from '@angular/core';
import { MagicWandService } from './magic-wand.service';
import { Output, EventEmitter } from '@angular/core';
import { MaskTool } from './MaskToolEnum';
import { Coordinate } from './Coordinate';
import * as Mask from './mask-action';
import { Zoom } from '../enums';

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
  @Input() translationCoords: Coordinate;

  @Output() newMaskEvent = new EventEmitter<Mask.MaskAction>();
  @Output() newPaintEvent = new EventEmitter<Coordinate>();
  @Output() continuePaintEvent = new EventEmitter<Coordinate>();
  @Output() newPaintMaskEvent = new EventEmitter<void>();

  @Output() newMouseMoveEvent = new EventEmitter<MouseEvent>();
  @Output() newMouseOutEvent = new EventEmitter<void>();

  @Output() newPanEvent = new EventEmitter<Coordinate>();
  @Output() newDestinationEvent = new EventEmitter<Coordinate>();
  @Output() newZoomEvent = new EventEmitter<Zoom>();

  // Set containing pixels converted to their red index in ImageData. Used for paint and scribble
  paintPixels: Set<number>;
  mouseDown: boolean = false;
  // Determines if the user moved after they clicked, and does scribble fill instead of flood.
  scribbleFill: boolean = false;

  // Initial x&y coords.
  private coord: Array<number>;

  // Create direct reference of canvas on editor.html
  constructor(
    private canvas: ElementRef<HTMLCanvasElement>,
    private magicWandService: MagicWandService
  ) {}

  /**
   * Listens for user mousedown on 'appMask'. When user mouse goes down.
   * Initializes the 'paintPixels' set and emits starting pixel when the user presses the mouse.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    if (
      this.tool == MaskTool.PAINT ||
      this.tool == MaskTool.ERASE ||
      this.tool == MaskTool.MAGIC_WAND_ADD ||
      this.tool == MaskTool.MAGIC_WAND_SUB
    ) {
      this.coord = this.convertToUnscaledCoord(e.offsetX, e.offsetY);

      this.mouseDown = true;
      this.paintPixels = new Set<number>();

      //  Get pixel of original image that user clicked on.
      let pixel = new Coordinate(this.coord[0], this.coord[1]);

      // //  Add pixel to set for scribble fill or for master pixel list.
      this.paintPixels.add(
        this.magicWandService.coordToDataArrayIndex(
          this.coord[0],
          this.coord[1],
          this.originalImageData.width
        )
      );

      // Fire event to draw pixel
      this.newPaintEvent.emit(pixel);
      //Draw single pixel on mouse down
      if (this.tool == MaskTool.PAINT
        || this.tool == MaskTool.ERASE) {
        this.continuePaintEvent.emit(pixel);
      }
    } else if (this.tool == MaskTool.PAN) {
      this.mouseDown = true;
      this.coord = this.convertToUnscaledCoord(e.offsetX, e.offsetY);

    }
  }

  /**
   * Listens for mouse movement over appMask, executes if user's mouse is clicked.
   * For each movement, the pixel is added to the paintPixels set and then painted
   *   on the canvas.
   * If the user's tool is pan, then emits an event to redraw image given new offset.
   */
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (
      (this.tool == MaskTool.PAINT ||
        this.tool == MaskTool.ERASE ||
        this.tool == MaskTool.MAGIC_WAND_ADD ||
        this.tool == MaskTool.MAGIC_WAND_SUB) &&
      this.mouseDown
    ) {
      const coord = this.convertToUnscaledCoord(e.offsetX, e.offsetY);

      // User moved mouse, use scribble fill.
      this.scribbleFill = true;

      // Get pixel of user moved over.
      let pixel = new Coordinate(coord[0], coord[1]);

      this.paintPixels.add(
        this.magicWandService.coordToDataArrayIndex(
          coord[0],
          coord[1],
          this.originalImageData.width
        )
      );
      // Fire event to draw pixel
      this.continuePaintEvent.emit(pixel);
    } else if (this.tool == MaskTool.PAN && this.mouseDown) {
      const offsetCoord = this.convertToUnscaledCoord(e.offsetX, e.offsetY);
      this.newPanEvent.emit(this.getPanDestinationCoord(offsetCoord));
    }
    this.newMouseMoveEvent.emit(e);
  }

  /** If user's cursor leaves canvas, drawing is done. */
  @HostListener('mouseout', ['$event'])
  onMouseLeave(e: MouseEvent) {
    if (this.mouseDown) {
      this.onMouseUp(e);
    }
    this.newMouseOutEvent.emit();
  }

  /**
   * Executes once user releases mouse
   * Calls magic-wand.service paint/scribbleFloodFill/floodFill function
   *   depending on what tool is selected and if the user moved the mouse or not.
   * If normal floodFill, then records the x and y offset, retrieves the tolerance and calls the
   *   floodfill algorithm.
   * If the user moved the mouse before picking up their mouse, then floodFill does not execute.
   *   scribble is called instead with @param paintPixels.
   */
  @HostListener('mouseup', ['$event'])
  onMouseUp(e: MouseEvent) {
    this.mouseDown = false;
    //  If user has paint selected, call paint to add pixels painted to master.
    //  TODO Pass back a set of all pixels added to the mask. aka, draw paint pixels then capture then make mask action
    if (this.tool == MaskTool.PAINT || this.tool == MaskTool.ERASE) {
      this.scribbleFill = false;
      this.newPaintMaskEvent.emit();
    } 
    //  If user has Magic wand selected and they moved the mouse, call scribbleFlood Fill.
    else if ((this.tool == MaskTool.MAGIC_WAND_ADD
        || this.tool == MaskTool.MAGIC_WAND_SUB) 
        && this.scribbleFill) {

      this.scribbleFill = false;
      const maskPixels = this.magicWandService.scribbleFloodfill(
        this.originalImageData,
        this.coord[0],
        this.coord[1],
        this.tolerance,
        this.paintPixels
      );

      this.newMaskEvent.emit(
        new Mask.MaskAction(
          this.tool == MaskTool.MAGIC_WAND_ADD
            ? Mask.Action.ADD
            : Mask.Action.SUBTRACT,
          Mask.Tool.SCRIBBLE,
          maskPixels
        )
      );
    } else if (
      (this.tool == MaskTool.MAGIC_WAND_ADD ||
        this.tool == MaskTool.MAGIC_WAND_SUB) &&
      !this.scribbleFill
    ) {
      // Returns an array indices of each pixel in the mask.
      const maskPixels = this.magicWandService.floodfill(
        this.originalImageData,
        this.coord[0],
        this.coord[1],
        this.tolerance
      );

      this.newMaskEvent.emit(
        new Mask.MaskAction(
          this.tool == MaskTool.MAGIC_WAND_ADD
            ? Mask.Action.ADD
            : Mask.Action.SUBTRACT,
          Mask.Tool.MAGIC_WAND,
          maskPixels
        )
      );
    } else if (this.tool == MaskTool.PAN) {
      const offsetCoord = this.convertToUnscaledCoord(e.offsetX, e.offsetY);
      this.newDestinationEvent.emit(this.getPanDestinationCoord(offsetCoord));
    }
  }

 /** 
  *  Translates user inputed coordinate to appropriate corresponding 
  *  coordinate on original image.
  */
  convertToUnscaledCoord(xOffset: number, yOffset: number): Array<number> {
    return new Array<number>(
      Math.floor(xOffset / this.scale) - this.translationCoords.x,
      Math.floor(yOffset / this.scale) - this.translationCoords.y
    );
  }

  /** Computes destination coordinate based on where the user moved their mouse to.*/
  getPanDestinationCoord(offsetCoord: Array<number>) {
    return new Coordinate((offsetCoord[0] - this.coord[0] + this.translationCoords.x), 
                          (offsetCoord[1] - this.coord[1] + this.translationCoords.y))
  }
}
