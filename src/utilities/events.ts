export function preventDefault(fn: (e: Event) => unknown) {
  return (event: Event) => {
    event.preventDefault();
    fn(event);
  };
}
