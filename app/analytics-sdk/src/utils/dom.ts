
/**
 * Generate a simple CSS selector path for an element
 * e.g. body > div:nth-child(1) > button#btn-submit
 */
export function getDomPath(element: HTMLElement): string {
  if (!(element instanceof Element)) return '';
  
  const path: string[] = [];
  let current: Element | null = element;

  while (current) {
    let name = current.tagName.toLowerCase();
    
    if (current.id) {
      name += `#${current.id}`;
      path.unshift(name);
      break; // ID is unique enough
    }

    if (current === document.body) {
      path.unshift(name);
      break;
    }

    // Calculate nth-child if needed
    let parent = current.parentElement;
    if (parent) {
      const children = Array.from(parent.children);
      const index = children.indexOf(current) + 1;
      if (index > 0 && children.length > 1) {
        name += `:nth-child(${index})`;
      }
    }
    
    path.unshift(name);
    current = current.parentElement;
  }

  return path.join(' > ');
}
