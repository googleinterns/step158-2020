import { HostListener, Component, OnInit } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Zoom, UndoRedo, SwitchImage } from '../enums';

@Component({
  selector: 'app-top-toolbar',
  templateUrl: './top-toolbar.component.html',
  styleUrls: ['./top-toolbar.component.css'],
})
export class TopToolbarComponent implements OnInit {
  @Output() clearMaskEvent = new EventEmitter<void>();
  @Output() invertMaskEvent = new EventEmitter<void>();
  @Output() undoRedoEvent = new EventEmitter<UndoRedo>();
  @Output() switchImageEvent = new EventEmitter<SwitchImage>();
  @Output() newToleranceEvent = new EventEmitter<number>();
  @Output() newZoomEvent = new EventEmitter();
  toleranceValue: number;
  // To use enum in html
  Zoom = Zoom;
  UndoRedo = UndoRedo;
  SwitchImage = SwitchImage;

  @HostListener('window:keydown', ['$event'])
  handleKeyDown($event: KeyboardEvent) {
    if ($event.ctrlKey || $event.metaKey) {
      switch ($event.keyCode) {
        case 89:
          console.log('CTRL + Y');
          this.undoRedo(UndoRedo.REDO);
          break;
        case 90:
          console.log('CTRL + Z');
          this.undoRedo(UndoRedo.UNDO);
          break;
        case 91:
          console.log('[');
          this.zoom(Zoom.IN);
          break;
        case 93:
          console.log(']');
          this.zoom(Zoom.OUT);
          break;
      }
    } else {
      switch ($event.keyCode) {
        case 37:
          console.log('left-arrow');
          this.switchImage(SwitchImage.PREVIOUS);
          break;
        case 39:
          console.log('right-arrow');
          this.switchImage(SwitchImage.NEXT);
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
        case 219:
          console.log('[');
          this.zoom(Zoom.IN);
          break;
        case 221:
          console.log(']');
          this.zoom(Zoom.OUT);
          break;
      }
    }
  }

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

  undoRedo(direction: UndoRedo) {
    this.undoRedoEvent.emit(direction);
  }

  switchImage(direction: SwitchImage) {
    const confirmSave = confirm(
      'Are you sure you want to switch images? Make sure to save your current mask!'
    );
    if (confirmSave) {
      this.switchImageEvent.emit(direction);
    }
  }

  /** Emits value of user inputed/slider tolerance. */
  updateTolerance() {
    this.newToleranceEvent.emit(this.toleranceValue);
  }

  zoom(zoomType: Zoom) {
    this.newZoomEvent.emit(zoomType);
  }
}
