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

  @Output() newMaskEvent = new EventEmitter<Set<number>>();

  // create direct reference of canvas on editor.html
  constructor(
    private canvas: ElementRef<HTMLCanvasElement>, 
    private magicWandService: MagicWandService,
  ) { }

  //  Directive is a child of editor (the appMask selector on canvas connects the two)
  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    const xCoord = e.offsetX;
    const yCoord = e.offsetY;

    // TODO(shmcaffrey): Tolerance will come from user input.
    const tolerance = 20;
    console.log('scale: ' + this.scale);
    if (!this.originalImageData) {
      console.log("ORIGINAL IMAGE DATA IS NULL");
      return;
    }
    
    // returns an array indices of each pixel in the mask.
    const maskPixels = this.magicWandService.floodfill(
      this.originalImageData, 
      Math.floor(xCoord / this.scale), 
      Math.floor(yCoord / this.scale), 
      tolerance);

      this.newMaskEvent.emit(maskPixels);
  }

  ngOnChange(changes: SimpleChanges) {
    for (const propName in changes) {
      const chng = changes[propName];
      const cur  = JSON.stringify(chng.currentValue);
      const prev = JSON.stringify(chng.previousValue);
      console.log(`${propName}: currentValue = ${cur}, previousValue = ${prev}`);
    }
  }
}
