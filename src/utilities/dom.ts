function isFocusable(
  element: Element | null,
  skipSelectors: string[]
): boolean {
  if (!element) return false;

  // Check if the element itself is hidden or inert
  const isHidden = (element as HTMLElement).hidden;
  const isDisabled = (element as HTMLInputElement).disabled;
  const isInert = (element as HTMLElement).inert;

  if (isHidden || isDisabled || isInert) return false;

  // Check if the element or any of its parents are inert
  let parent: HTMLElement | null = element.parentElement;
  while (parent) {
    if (parent.inert) return false;
    parent = parent.parentElement;
  }

  // Check if the element matches any of the skip selectors
  if (
    skipSelectors.some((selector) => (element as HTMLElement).matches(selector))
  ) {
    return false;
  }

  // Check if the element is focusable
  const focusableSelectors = [
    "a[href]",
    "area[href]",
    'input:not([disabled]):not([type="hidden"]):not([inert])',
    "select:not([disabled]):not([inert])",
    "textarea:not([disabled]):not([inert])",
    "button:not([disabled]):not([inert])",
    "iframe",
    "object",
    "embed",
    "[contenteditable]",
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableSelectors.some((selector) =>
    (element as HTMLElement).matches(selector)
  );
}

export function findFirstFocusableElement(
  root: HTMLElement | null,
  skipSelectors: string[] = []
): HTMLElement | null {
  if (!root) return null;

  const elements = root.querySelectorAll<HTMLElement>("*");
  for (let element of elements) {
    if (isFocusable(element, skipSelectors)) {
      return element;
    }
  }

  return null;
}
