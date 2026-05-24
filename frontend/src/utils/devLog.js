export function devLog(...args) {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}
