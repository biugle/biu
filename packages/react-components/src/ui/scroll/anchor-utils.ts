export type AnchorHeadingLevel = 1 | 2 | 3 | 4 | 5;

export interface AnchorHeading {
  id: string;
  level: AnchorHeadingLevel;
  label: string;
  element: HTMLElement;
}

export interface AnchorHeadingNode extends AnchorHeading {
  children: AnchorHeadingNode[];
}

function headingLevel(element: HTMLElement): AnchorHeadingLevel | null {
  const value = Number(element.tagName.slice(1));
  return value >= 1 && value <= 5 ? (value as AnchorHeadingLevel) : null;
}

function headingSlug(label: string, index: number) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `biu-anchor-${slug || `section-${index + 1}`}`;
}

function isEnglishAnchorId(value: string) {
  return /^[a-z][a-z0-9-]*$/i.test(value);
}

export function collectHeadings(root: ParentNode, selector: string, levels: Set<AnchorHeadingLevel>) {
  let nodes: HTMLElement[] = [];
  try {
    nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  } catch {
    return [];
  }
  const usedIds = new Set<string>();
  return nodes.reduce<AnchorHeading[]>((result, element, index) => {
    const level = headingLevel(element);
    if (!level || !levels.has(level)) return result;
    const label = element.textContent?.trim() ?? "";
    if (!label) return result;

    let id = element.id && isEnglishAnchorId(element.id) ? element.id : headingSlug(label, index);
    let suffix = 2;
    while (usedIds.has(id)) id = `${element.id || headingSlug(label, index)}-${suffix++}`;
    if (element.id !== id) element.id = id;
    usedIds.add(id);
    result.push({ id, level, label, element });
    return result;
  }, []);
}

export function headingsKey(headings: AnchorHeading[]) {
  return headings.map((heading) => `${heading.id}\u0000${heading.level}\u0000${heading.label}`).join("\u0001");
}

function nodeContainsHeading(node: Node, selector: string) {
  if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return false;
  const element = node as Element;
  try {
    const matches = typeof element.matches === "function" && element.matches(selector);
    const contains = typeof element.querySelector === "function" && Boolean(element.querySelector(selector));
    return Boolean(matches || contains);
  } catch {
    return false;
  }
}

export function mutationTouchesHeading(record: MutationRecord, selector: string) {
  if (record.type === "characterData") {
    const parent = record.target.parentElement;
    if (!parent) return false;
    try {
      return Boolean(parent.closest(selector));
    } catch {
      return false;
    }
  }
  if (record.type !== "childList") return false;
  const target = record.target.nodeType === Node.ELEMENT_NODE ? (record.target as Element) : undefined;
  try {
    if (target?.matches(selector)) return true;
  } catch {
    return false;
  }
  return [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some((node) =>
    nodeContainsHeading(node, selector),
  );
}

export function buildHeadingTree(headings: AnchorHeading[]) {
  const roots: AnchorHeadingNode[] = [];
  const stack: AnchorHeadingNode[] = [];
  for (const heading of headings) {
    const node: AnchorHeadingNode = { ...heading, children: [] };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}
