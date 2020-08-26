import { Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.css']
})
export class TopToolbarComponent implements OnInit {

  @Output() clearMaskEvent = new EventEmitter<void>();
  @Output() invertMaskEvent = new EventEmitter<void>();
  @Output() undoRedoEvent = new EventEmitter<string>();
  @Output() switchImageEvent = new EventEmitter<boolean>();
  @Output() newToleranceEvent = new EventEmitter<number>();

  toleranceValue: number;

  constructor() { }

  ngOnInit(): void {
    this.toleranceValue = 30;
   }

  /** Called when user clicks clear mask button. */
  clearMask() {
    this.clearMaskEvent.emit();
  }

  /** Called when user clicks the invert mask button. */
  invertMask() {
    this.invertMaskEvent.emit();
  }

  undoRedo(direction: string) {
    this.undoRedoEvent.emit(direction);
  }

  switchImage(previous: boolean) {
    const confirmSave = confirm(
        'Are you sure you want to switch images? Make sure to save your current mask!');
    if (confirmSave) {
      this.switchImageEvent.emit(previous);
    }
  }

  /** Emits value of user inputed/slider tolerance. */
  updateTolerance() {
    this.newToleranceEvent.emit(this.toleranceValue);
  }
}
