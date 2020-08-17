import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

  @Output() clearMaskEvent = new EventEmitter<void>();
  @Output() newToleranceEvent = new EventEmitter<number>();
  @Output() newMaskToolEvent = new EventEmitter<string>();
  @Output() invertMaskEvent = new EventEmitter<void>();

  value: number;
  maskTool: string;

  constructor() { }

  ngOnInit(): void {
    this.value = 30;
    this.maskTool = 'magic-wand';
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

  /** Emits value of user inputed/slider tolerance. */
  updateTolerance() {
    this.newToleranceEvent.emit(this.value);
  }

  invertMask() {
    this.invertMaskEvent.emit();
  }
}
