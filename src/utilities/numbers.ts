export function roundAbsoluteToTwoDecimalPlaces(num: number): string {
  let roundedNum: string = parseFloat(Math.abs(num).toFixed(2)).toString();
  return roundedNum;
}

export const MAX_AGGREGATE = 2;
