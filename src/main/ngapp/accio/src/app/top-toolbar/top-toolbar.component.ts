import { HostListener, Component, OnInit } from '@angular/core';
import { MaskControllerService } from '../editor/mask-controller.service';
import { MaskAction, Tool, Action } from '../editor/mask-action';
import { Output, EventEmitter } from '@angular/core';

export class SaveState {
  constructor(public text: string, public icon: string) {}
}

export enum UndoRedo {
  UNDO = 'undo',
  REDO = 'redo',
}

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

  UndoRedo = UndoRedo;

  readonly SAVED_STATE: SaveState = new SaveState('up to date', 'check');
  readonly UNSAVED_STATE: SaveState = new SaveState(
    'unsaved changes',
    'history'
  );

  toleranceValue: number;

  @HostListener('window:keydown', ['$event'])
  handleKeyDown($event: KeyboardEvent) {
    if ($event.ctrlKey || $event.metaKey) {
      switch ($event.keyCode) {
        case 89:
          console.log('CTRL + Y');
          this.undoRedo(UndoRedo.UNDO);
          break;
        case 90:
          console.log('CTRL + Z');
          this.undoRedo(UndoRedo.REDO);
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

  constructor(private maskControllerService: MaskControllerService) {}

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

  undoRedo(undoRedo: UndoRedo) {
    this.undoRedoEvent.emit(undoRedo);
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
  updateTolerance() {
    this.newToleranceEvent.emit(this.toleranceValue);
  }

  /**
   * Return the SaveState based on the maskControllerService state including
   * the text and icon to display.
   */
  getSaveState(): SaveState {
    if (this.maskControllerService.isSaved()) {
      return this.SAVED_STATE;
    }
    return this.UNSAVED_STATE;
  }

  /**
   * Return the tool name of the last or next action for hover preview.
   */
  getUndoRedoToolName(undoRedo: UndoRedo): string {
    let maskAction: MaskAction;
    if (undoRedo === UndoRedo.UNDO) {
      maskAction = this.maskControllerService.prevAction();
    } else {
      maskAction = this.maskControllerService.nextAction();
    }
    if (
      maskAction.getActionType() === Action.ADD ||
      maskAction.getActionType() === Action.SUBTRACT
    ) {
      return maskAction.getActionType() + ' with ' + maskAction.getToolName();
    }
    return maskAction.getToolName();
  }
}
