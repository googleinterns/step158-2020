import { MaskAction } from './mask-action';

export enum Status {
  STATUS_FAILURE = -1,
  STATUS_SUCCESS = 0,
}

export enum Move {
  BACK_ONE = -1,
  FORWARD_ONE = 1,
}

export class MaskController {
  private history: Array<MaskAction> = [];
  // pPresent at an invalid index until an action is performed
  private pPresent: number = -1;

  constructor(private mask: Set<number> = new Set()) {}

  public getMask(): Set<number> {
    return this.mask;
  }

  /**
   * Moves history and updates mask.
   * @param     {Move}          direction
   * @return    {Status}
   */
  private move(direction: Move): Status {
    if (direction !== Move.BACK_ONE && direction !== Move.FORWARD_ONE) {
      console.log(
        'Error: Must move through edit history one action at a time.'
      );
      return Status.STATUS_FAILURE;
    }
    let newIndex: number = this.pPresent + direction;
    if (newIndex < -1 || newIndex > this.history.length - 1) {
      return Status.STATUS_FAILURE;
    }
    this.pPresent = newIndex;

    if (direction === Move.FORWARD_ONE) {
      this.mask = this.history[this.pPresent].apply(direction, this.mask);
    } else {
      this.mask = this.history[this.pPresent + 1].apply(direction, this.mask);
    }
    return Status.STATUS_SUCCESS;
  }

  /**
   * Adds a new action to the history.
   * @param     {MaskAction}    action
   * @return    {Status}
   */
  public do(action: MaskAction): Status {
    if (this.pPresent < this.history.length - 1) {
      this.history.splice(this.pPresent + 1);
    }
    this.history.push(action);
    return this.move(Move.FORWARD_ONE);
  }

  public undo(): Status {
    return this.move(Move.BACK_ONE);
  }

  public redo(): Status {
    return this.move(Move.FORWARD_ONE);
  }
}
