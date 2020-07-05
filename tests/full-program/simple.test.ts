import compile from '../../src/main';
describe("Simple program tests", () => {
  it("Should compile a simple program with only one line", () => 
    {
      compile('fn main(): number { return 5; }')
    });
});

