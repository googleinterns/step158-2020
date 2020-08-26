import { MaskAction, Action } from './mask-action';
import { SetOperator } from './set-operator';
import { Injectable } from '@angular/core';

export enum Move {
  BACK_ONE = -1,
  FORWARD_ONE = 1,
}

@Injectable({
  providedIn: 'root',
})
export class MaskControllerService {
  private history: Array<MaskAction> = [];
  private savedMask: Set<number>;

  // pPresent and pSaved at an invalid index until an action is performed
  private pPresent: number = -1;
  private pSaved: number = -1;

  // TODO: need to construct with Set in editor component when mask editing
  //       feature added
  constructor(private mask: Set<number> = new Set([])) {
    this.savedMask = mask;
  }

  /**
   * Returns current mask.
   */
  public getMask(): Set<number> {
    return this.mask;
  }

  /**
   * Returns the save status of the mask.
   */
  public isSaved(): boolean {
    return (
      this.pSaved === this.pPresent &&
      SetOperator.isEqual(this.savedMask, this.mask)
    );
  }

  /**
   * Sets the current position in history as the saved position.
   * Should be called after updating the mask in the database.
   */
  public save(): void {
    this.pSaved = this.pPresent;
    this.savedMask = this.mask;
  }

  /**
   * Moves history and updates mask.
   * @param     {Move}          direction
   * @return    {Status}
   */
  private move(direction: Move): MaskAction {
    if (direction !== Move.BACK_ONE && direction !== Move.FORWARD_ONE) {
      console.log(
        'Error: Must move through edit history one action at a time.'
      );
      return null;
    }
    let newIndex: number = this.pPresent + direction;
    if (newIndex < -1 || newIndex > this.history.length - 1) {
      return null;
    }
    this.pPresent = newIndex;

    if (direction === Move.FORWARD_ONE) {
      this.mask = this.history[this.pPresent].apply(direction, this.mask);
      return this.history[this.pPresent];
    } else {
      this.mask = this.history[this.pPresent + 1].apply(direction, this.mask);
      return this.history[this.pPresent + 1];
    }
  }

  /**
   * Adds a new action to the history.
   * @param     {MaskAction}    action
   * @return    {Status}
   */
  public do(action: MaskAction, allPixels?: Set<number>): MaskAction {
    if (this.pPresent < this.history.length - 1) {
      this.history.splice(this.pPresent + 1);
    }
    switch (action.getActionType()) {
      case Action.ADD:
        action = new MaskAction(
          Action.ADD,
          action.getToolName(),
          SetOperator.difference(action.getChangedPixels(), this.mask)
        );
        break;
      case Action.SUBTRACT:
        console.log(allPixels.size);
        console.log(action.getChangedPixels().size)
        action = new MaskAction(
          Action.SUBTRACT,
          action.getToolName(),
          SetOperator.difference(
            action.getChangedPixels(),
            SetOperator.symmetricDifference(this.mask, allPixels)
          )
        );
    }
    this.history.push(action);
    return this.move(Move.FORWARD_ONE);
  }

  public undo(): MaskAction {
    return this.move(Move.BACK_ONE);
  }

  public redo(): MaskAction {
    return this.move(Move.FORWARD_ONE);
  }
}
