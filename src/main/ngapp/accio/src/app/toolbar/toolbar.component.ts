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

  value: number = 30;

  constructor() { }

  ngOnInit(): void { }

  /** Called when user clicks clear mask button */
  clearMask() {
    this.clearMaskEvent.emit();
  }

  updateTolerance() {
    this.newToleranceEvent.emit(this.value);
  }
}
