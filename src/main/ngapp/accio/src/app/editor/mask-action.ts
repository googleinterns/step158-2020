import { SetOperator } from './set-operator';
import { Move } from './mask-controller';

export enum Action {
  ADD = 'add',
  SUBTRACT = 'subtract',
  INVERT = 'invert', 
  CLEAR = 'clear,'
}

export enum Tool {
    MAGIC_WAND = 'magic wand', //floodfill
    SCRIBBLE = 'scribble magic wand', //scribble floodfill
    PAINTBRUSH = 'paintbrush',
    ERASER = 'erase',
    INVERT = 'invert',
    CLEAR = 'clear',
}

export class MaskAction {
  constructor(
    private actionType: Action,
    private toolName: Tool,
    
    /* 
     * Expected values for changedPixels:
     *   ADD: the added pixels
     *   SUBTRACT: the removed pixels
     *   INVERT: every pixel of the image
     *   CLEAR: the pixels of the current mask
    */ 
    private changedPixels: Set<number>
  ) {}

  public getActionType(): Action {
    return this.actionType;
  }

  public getToolName(): Tool {
    return this.toolName;
  }

  /**
   * Does or undoes the action.
   * @param     {Move}          direction
   * @param     {Set<number>}   currentMask
   * @return    {Set<number>}
   */
  public apply(direction: Move, currentMask: Set<number>): Set<number> {
    switch (this.actionType) {
      case Action.ADD:
        if (direction === Move.FORWARD_ONE) {
          return SetOperator.union(currentMask, this.changedPixels);
        }
        return SetOperator.difference(currentMask, this.changedPixels);
      case Action.SUBTRACT:
        if (direction === Move.FORWARD_ONE) {
          return SetOperator.difference(currentMask, this.changedPixels);
        }
        return SetOperator.union(currentMask, this.changedPixels);
      case Action.INVERT:
        return SetOperator.symmetricDifference(currentMask, this.changedPixels);
      case Action.CLEAR:
        if (direction === Move.FORWARD_ONE) {
          return new Set([]);
        }
        return this.changedPixels;
    }
  }
}
