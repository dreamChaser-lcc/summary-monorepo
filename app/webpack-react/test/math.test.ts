import { add, subtract } from '../src/utils/math';

describe('Math Utils', () => {
  test('adds two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  test('subtracts two numbers', () => {
    expect(subtract(3, 1)).toBe(2);
  });
});
