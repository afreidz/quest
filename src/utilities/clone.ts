export default function clone<T>(a: T) {
  return JSON.parse(JSON.stringify(a)) as T;
}
