import { nanoid } from "nanoid";
import { performance } from "perf_hooks";

const maxDigit = Math.pow(10,13) - 1;

export const uuid = (): string => {
  return maxDigit - new Date().getTime() + "-" + performance.now() + "-" + nanoid();
};