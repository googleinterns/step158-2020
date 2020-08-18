import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  @Output() clearMaskEvent = new EventEmitter<void>();
  @Output() newMaskToolEvent = new EventEmitter<string>();
  @Output() invertMaskEvent = new EventEmitter<void>();
  @Output() newToleranceEvent = new EventEmitter<number>();
  @Output() newMaskAlphaEvent = new EventEmitter<number>();

  toleranceValue: number;
  maskAlphaValue: number;
  maskTool: string;

  constructor() { }

  ngOnInit(): void {
    this.toleranceValue = 30;
    this.maskAlphaValue = 1;
    this.maskTool = "MAGIC-WAND";
  }

  /** Changes selected tool value and emits change. */
  updateTool(tool: string) {
    this.maskTool = tool;
    this.newMaskToolEvent.emit(tool);
  }

  /** Called when user clicks clear mask button. */
  clearMask() {
    this.clearMaskEvent.emit();
  }

  /** Called when user clicks the invert mask button. */
  invertMask() {
    this.invertMaskEvent.emit();
  }

  /** Emits value of user inputed/slider tolerance. */
  updateTolerance() {
    this.newToleranceEvent.emit(this.toleranceValue);
  }

  /** Emits value of user inputed/slider alpha value. */
  updateMaskAlpha() {
    this.newMaskAlphaEvent.emit(this.maskAlphaValue);
  }
}
