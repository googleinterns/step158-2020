import { HostListener, Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit {
  @Output() newMaskToolEvent = new EventEmitter<string>();
  //@Output() newToleranceEvent = new EventEmitter<number>();
  @Output() newMaskAlphaEvent = new EventEmitter<number>();
  @Output() newWidthEvent = new EventEmitter<number>();

  @HostListener('window:keydown', ['$event'])
  handleKeyDown($event: KeyboardEvent) {
    switch ($event.keyCode) {
      case 51:
        console.log('3');
        this.brushWidth = Math.max(this.brushWidth - 1, 0.0);
        this.updateWidth();
        break;
      case 52:
        console.log('4');
        this.brushWidth = Math.min(this.brushWidth + 1, 80);
        this.updateWidth();
        break;
      case 66:
        console.log('B');
        this.updateTool('PAINT');
        break;
      case 69:
        console.log('E');
        this.updateTool('ERASE');
        break;
      case 77:
        console.log('M');
        this.updateTool('MASK-ONLY');
        break;
      case 81:
        console.log('Q');
        this.updateTool('MAGIC-WAND-SUB');
        break;
      case 84:
        console.log('T');
        if (this.maskAlphaValue > 0) {
          this.oldMaskAlphaValue = this.maskAlphaValue;
          this.maskAlphaValue = 0;
          this.updateMaskAlpha(0);
        } else {
          this.maskAlphaValue = this.oldMaskAlphaValue;
          this.updateMaskAlpha(this.oldMaskAlphaValue);
        }
        break;
      case 87:
        console.log('W');
        this.updateTool('MAGIC-WAND-ADD');
        break;
    }
  }

  //toleranceValue: number;
  oldMaskAlphaValue: number;
  maskAlphaValue: number;
  maskTool: string;
  brushWidth: number;

  constructor() {}

  ngOnInit(): void {
    //this.toleranceValue = 30;
    this.maskAlphaValue = 1;
    this.maskTool = 'MAGIC-WAND-ADD';
    this.brushWidth = 1;
  }

  /** Changes selected tool value and emits change. */
  updateTool(tool: string) {
    this.maskTool = tool;
    this.newMaskToolEvent.emit(tool);
  }

  /** Emits value of user inputed/slider alpha value. */
  updateMaskAlpha(alphaValue: number) {
    this.newMaskAlphaEvent.emit(alphaValue);
  }

  updateWidth() {
    this.newWidthEvent.emit(this.brushWidth);
  }
}
