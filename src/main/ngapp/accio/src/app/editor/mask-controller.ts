import { MaskCommand } from './mask-command';

export enum Status {
  STATUS_FAILURE = -1,
  STATUS_SUCCESS = 0,
}

export class MaskController {
  private history: Array<MaskCommand> = [];
  // pPresent at an invalid index until an action is performed
  private pPresent: number = -1;

  constructor(private mask: Set<number> = new Set()) {}

  public getMask(): Set<number> {
    return this.mask;
  }

  private do(direction: number): Status {
    if (direction !== -1 && direction !== 1) {
      console.log(
        'Error: Must move through edit history one action at a time.'
      );
      return Status.STATUS_FAILURE;
    }
    let newIndex: number = this.pPresent + direction;
    if (newIndex < -1 || newIndex > history.length - 1) {
      return Status.STATUS_FAILURE;
    }
    this.pPresent = newIndex;

    let newMask: Set<number> = this.history[this.pPresent].apply(
      direction,
      this.mask
    );

    if (newMask === null) {
      console.log('Error: Action cannot be completed.');
      return Status.STATUS_FAILURE;
    }

    this.mask = newMask;
    return Status.STATUS_SUCCESS;
  }

  public addAction(action: MaskCommand): Status {
    if (this.pPresent < this.history.length - 1) {
      this.history.splice(this.pPresent + 1);
    }
    this.history.push(action);
    return this.do(1);
  }

  public undo(): Status {
    return this.do(-1);
  }

  public redo(): Status {
    return this.do(1);
  }
}
