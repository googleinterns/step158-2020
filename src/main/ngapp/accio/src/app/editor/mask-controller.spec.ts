import { MaskController, Status } from './mask-controller';
import { MaskAction, Action, Tool } from './mask-action';

describe('MaskController', () => {
  let maskController: MaskController;

  beforeEach(() => {
    let initialMask: Set<number> = new Set([1, 2, 3, 4]);
    maskController = new MaskController(initialMask);
  });

  it('should add new action', () => {
    const expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should undo action', () => {
    const expectedMask = new Set([1, 2, 3, 4]);
    maskController.do(
      new MaskAction(
        Action.INVERT,
        Tool.MAGIC_WAND,
        new Set([1, 2, 3, 4, 5, 6])
      )
    );
    expect(maskController.getMask()).toEqual(new Set([5, 6]));
    maskController.undo();
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should redo action', () => {
    const expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    expect(maskController.getMask()).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    maskController.undo();
    maskController.redo();
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should not undo if no prior history', () => {
    const expectedMask = new Set([1, 2, 3, 4]);
    expect(maskController.undo()).toEqual(Status.STATUS_FAILURE);
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should not redo if no prior history', () => {
    const expectedMask = new Set([1, 2, 3, 4]);
    expect(maskController.redo()).toEqual(Status.STATUS_FAILURE);
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should not redo if a new action follows undo', () => {
    const expectedMask = new Set([3, 4]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    maskController.undo();
    maskController.do(
      new MaskAction(Action.SUBTRACT, Tool.MAGIC_WAND, new Set([1, 2]))
    );
    expect(maskController.redo()).toEqual(Status.STATUS_FAILURE);
    expect(maskController.getMask()).toEqual(expectedMask);
  });
});
