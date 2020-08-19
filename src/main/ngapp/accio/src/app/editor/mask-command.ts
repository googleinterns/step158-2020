import { SetOperator } from './set-operator';

export enum Action {
    ADD = 0,
    SUBTRACT = 1,
    INVERT = 2,
}

export enum Tool {
    MAGIC_WAND = 0,
    PAINTBRUSH = 1,
    ERASER = 2,
    INVERT = 3,
}

export class MaskCommand {
  constructor( 
    private actionType: Action,
    private toolName: Tool,
    private pixels: Set<number>
  ) {}

  public getActionType(): Action {
    return this.actionType;
  }

  public getToolName(): Tool {
    return this.toolName;
  }

  public apply(direction: number, currentMask: Set<number>): Set<number> {
    

    return currentMask;
  }
}
