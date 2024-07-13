// random decimal number between min and max
export const random = (min, max) => {
  return Math.random() * (max - min) + min;
};

// sinewave function between min and max domain values and 0-1 range values
export const sinewave = (min, max, percentage, interval = 4) => {
  const val = Math.sin(percentage * interval * Math.PI * 2) * (max - min) + min;
  if (val < min) return min;
  if (val > max) return max;
  return val;
};

// smooth increase from min to max
export const expIncrease = (min, max, percentage) => {
  return Math.pow(percentage, 3) * (max - min) + min;
};

// smooth decrease from max to min
export const expDecrease = (min, max, percentage) => {
  return Math.pow(percentage, 3) * (min - max) + max;
};

// logarithmic from min to max
export const logarithmic = (min, max, percentage) => {
  percentage *= 100;
  if (percentage < 1) return min;
  const normalizedPercentage =
    percentage * (Math.log(max) - Math.log(min)) + Math.log(min);

  const base = Math.E;
  const value = (max - min) * (Math.log(normalizedPercentage) / Math.log(base));
  if (value < min) return min;
  return value;
};

// linear increase from min to max
export const linearIncrease = (min, max, percentage) => {
  return percentage * (max - min) + min;
};

// linear decrease from max to min
export const linearDecrease = (min, max, percentage) => {
  return percentage * (min - max) + max;
};

// bell curve from min to max
export const gaussian = (min, max, percentage) => {
  const mid = (min + max) / 2;

  // Calculate a warped percentage using a quadratic function
  const warpedPercentage = -12 * Math.pow(percentage - 0.5, 2) + 1;

  // Scale and map the warped percentage to the desired range
  const val = mid + (max - mid) * warpedPercentage;
  if (val < min) return min;
  if (val > max) return max;
  return val;
};
