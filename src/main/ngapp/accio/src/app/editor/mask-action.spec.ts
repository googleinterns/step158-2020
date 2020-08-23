import { Move } from './mask-controller';
import { MaskAction, Action, Tool } from './mask-action';

describe('MaskAction', () => {
  const initialMask = new Set([1, 2, 3, 4]);

  it('should be correct action type', () => {
    let maskAction = new MaskAction(
      Action.ADD,
      Tool.MAGIC_WAND,
      new Set([5, 6])
    );
    expect(maskAction.getActionType()).toEqual(Action.ADD);
  });
  it('should be correct tool name', () => {
    let maskAction = new MaskAction(
      Action.ADD,
      Tool.MAGIC_WAND,
      new Set([5, 6])
    );
    expect(maskAction.getToolName()).toEqual(Tool.MAGIC_WAND);
  });
  it('should do add', () => {
    let expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    let maskAction = new MaskAction(
      Action.ADD,
      Tool.MAGIC_WAND,
      new Set([5, 6])
    );
    expect(maskAction.apply(Move.FORWARD_ONE, initialMask)).toEqual(
      expectedMask
    );
  });
  it('should undo add', () => {
    let expectedMask = new Set([1, 2]);
    let maskAction = new MaskAction(
      Action.ADD,
      Tool.MAGIC_WAND,
      new Set([3, 4])
    );
    expect(maskAction.apply(Move.BACK_ONE, initialMask)).toEqual(expectedMask);
  });
  it('should do subtract', () => {
    let expectedMask = new Set([1, 2]);
    let maskAction = new MaskAction(
      Action.SUBTRACT,
      Tool.MAGIC_WAND,
      new Set([3, 4])
    );
    expect(maskAction.apply(Move.FORWARD_ONE, initialMask)).toEqual(
      expectedMask
    );
  });
  it('should undo subtract', () => {
    let expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    let maskAction = new MaskAction(
      Action.SUBTRACT,
      Tool.MAGIC_WAND,
      new Set([5, 6])
    );
    expect(maskAction.apply(Move.BACK_ONE, initialMask)).toEqual(expectedMask);
  });
  it('should do invert', () => {
    let expectedMask = new Set([5, 6]);
    let maskAction = new MaskAction(
      Action.INVERT,
      Tool.MAGIC_WAND,
      new Set([1, 2, 3, 4, 5, 6])
    );
    expect(maskAction.apply(Move.FORWARD_ONE, initialMask)).toEqual(
      expectedMask
    );
  });
  it('should undo invert', () => {
    let expectedMask = new Set([5, 6]);
    let maskAction = new MaskAction(
      Action.INVERT,
      Tool.MAGIC_WAND,
      new Set([1, 2, 3, 4, 5, 6])
    );
    expect(maskAction.apply(Move.BACK_ONE, initialMask)).toEqual(
      expectedMask
    );
  });
  it('should do clear', () => {
    let expectedMask = new Set([]);
    let maskAction = new MaskAction(
      Action.CLEAR,
      Tool.CLEAR,
      new Set([1, 2, 3, 4])
    );
    expect(maskAction.apply(Move.FORWARD_ONE, initialMask)).toEqual(
      expectedMask
    );
  });
  it('should undo clear', () => {
    let initialClearedMask = new Set([]);
    let expectedMask = new Set([1, 2, 3, 4]);
    let maskAction = new MaskAction(
      Action.INVERT,
      Tool.CLEAR,
      new Set([1, 2, 3, 4])
    );
    expect(maskAction.apply(Move.BACK_ONE, initialClearedMask)).toEqual(
      expectedMask
    );
  });
});
