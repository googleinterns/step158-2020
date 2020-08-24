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
  it('should be initially saved', () => {
    const expectedMask = new Set([1, 2, 3, 4]);
    expect(maskController.getMask()).toEqual(expectedMask);
    expect(maskController.isSaved()).toEqual(true);
  });
  it('should save', () => {
    const expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.save();
    expect(maskController.isSaved()).toEqual(true);
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should no longer be saved', () => {
    const expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.save();
    expect(maskController.isSaved()).toEqual(true);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.undo();   
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(new Set([1, 2, 3, 4]));
  });
  it('should be saved after redoing to the last saved position', () => {
    const expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.save();
    expect(maskController.isSaved()).toEqual(true);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.undo();   
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(new Set([1, 2, 3, 4]));
    maskController.redo();
    expect(maskController.isSaved()).toEqual(true);
    expect(maskController.getMask()).toEqual(expectedMask);
  });
  it('should not be saved at the same history position with a different mask', () => {
    const expectedMask = new Set([1, 2, 3, 4, 5, 6]);
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6]))
    );
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.save();
    expect(maskController.isSaved()).toEqual(true);
    expect(maskController.getMask()).toEqual(expectedMask);
    maskController.undo();   
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(new Set([1, 2, 3, 4]));
    maskController.do(
      new MaskAction(Action.ADD, Tool.MAGIC_WAND, new Set([5, 6, 7]))
    );
    expect(maskController.isSaved()).toEqual(false);
    expect(maskController.getMask()).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
  });
});
