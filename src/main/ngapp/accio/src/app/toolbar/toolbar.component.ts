import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  @Output() newMaskToolEvent = new EventEmitter<string>();
  @Output() newToleranceEvent = new EventEmitter<number>();
  @Output() newMaskAlphaEvent = new EventEmitter<number>();
  @Output() newWidthEvent = new EventEmitter<number>();

  // TODO Input what tool user has to deselect some sliders

  toleranceValue: number;
  maskAlphaValue: number;
  maskTool: string;
  brushWidth: number;

  constructor() { }

  ngOnInit(): void {
    this.toleranceValue = 30;
    this.maskAlphaValue = 1;
    this.maskTool = "MAGIC-WAND-ADD";
    this.brushWidth = 1;
  }

  /** Changes selected tool value and emits change. */
  updateTool(tool: string) {
    this.maskTool = tool;
    this.newMaskToolEvent.emit(tool);
  }

  /** Emits value of user inputed/slider tolerance. */
  updateTolerance() {
    this.newToleranceEvent.emit(this.toleranceValue);
  }

  /** Emits value of user inputed/slider alpha value. */
  updateMaskAlpha() {
    this.newMaskAlphaEvent.emit(this.maskAlphaValue);
  }

  updateWidth() {
    this.newWidthEvent.emit(this.brushWidth);
  }
}
