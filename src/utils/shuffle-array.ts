/**
 * Get a random integer from between the range `low` and `high`
 * @param low inclusive lower bound
 * @param high exclusive upper bound
 */
const getRandomInteger = (low: number, high: number) =>
  Math.floor(Math.random() * (high - low)) + low;

/**
 * Shuffles an array in place using Fisher-Yates
 */
export const shuffleArray = (arr: unknown[]) => {
  for (let lowIndex = 0; lowIndex < arr.length - 1; lowIndex += 1) {
    const swapIndex = getRandomInteger(lowIndex, arr.length);
    const temp = arr[lowIndex];
    arr[lowIndex] = arr[swapIndex];
    arr[swapIndex] = temp;
  }
};
