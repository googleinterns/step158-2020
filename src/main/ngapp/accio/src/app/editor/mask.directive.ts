import { Directive, HostListener, ElementRef, Input, SimpleChanges } from '@angular/core';
import { MagicWandService } from './magic-wand.service';
import { Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appMask]',
})
export class MaskDirective {
  //  ImageData from image user selects, drawn at real scale.
  @Input() originalImageData: ImageData;
  @Input() scale: number;
  @Input() tolerance: number;

  @Output() newMaskEvent = new EventEmitter<Set<number>>();

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
