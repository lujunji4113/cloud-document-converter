export const compare = (a: number, b: number) => {
  if (a === b) return 0;

  return a > b ? 1 : -1;
};
