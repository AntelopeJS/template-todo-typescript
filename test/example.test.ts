import assert from 'node:assert';

// Interface calls reject in tests unless a module listed in antelope.test.ts
// implements them, so load the modules your tests depend on there.
describe('example', () => {
  it('runs the test files of the test folder', () => {
    const tasks: string[] = ['Write tests'];
    assert.strictEqual(tasks.length, 1);
  });
});
