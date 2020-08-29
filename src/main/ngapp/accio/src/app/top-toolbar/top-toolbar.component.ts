import { HostListener, Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.css'],
})
export class TopToolbarComponent implements OnInit {
  @Output() clearMaskEvent = new EventEmitter<void>();
  @Output() invertMaskEvent = new EventEmitter<void>();
  @Output() undoRedoEvent = new EventEmitter<string>();
  @Output() switchImageEvent = new EventEmitter<boolean>();
  @Output() newToleranceEvent = new EventEmitter<number>();

  toleranceValue: number;

  @HostListener('window:keydown', ['$event'])
  handleKeyDown($event: KeyboardEvent) {
    if ($event.ctrlKey || $event.metaKey) {
      switch ($event.keyCode) {
        case 89:
          console.log('CTRL + Y');
          this.undoRedo('redo');
          break;
        case 90:
          console.log('CTRL + Z');
          this.undoRedo('undo');
          break;
      }
    } else {
      switch ($event.keyCode) {
        case 37:
          console.log('left-arrow');
          this.switchImage(true);
          break;
        case 39:
          console.log('right-arrow');
          this.switchImage(false);
          break;
        case 49:
          console.log('1');
          this.toleranceValue = Math.max(this.toleranceValue - 1, 0.0);
          this.updateTolerance();
          break;
        case 50:
          console.log('2');
          this.toleranceValue = Math.min(this.toleranceValue + 1, 127.5);
          this.updateTolerance();
          break;
      }
    }
  }

  constructor() {}

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
      'Are you sure you want to switch images? Make sure to save your current mask!'
    );
    if (confirmSave) {
      this.switchImageEvent.emit(previous);
    }
  }

  /** Emits value of user inputed/slider tolerance. */
  updateTolerance(event: MatSliderChange) {
    this.toleranceValue = event.value;
    this.newToleranceEvent.emit(this.toleranceValue);
  }
}
