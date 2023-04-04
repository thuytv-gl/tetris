/*
  * compare the tens of given numbers
  * e.g: n1 = 123, n2 = 234
  * n1 tens = 12
  * n2 tens = 23
  * => result false
  */
export const sameTens = (n1: number, n2: number) => {
  return Math.floor(n1/10) === Math.floor(n2/10);
}
