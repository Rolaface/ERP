import type { ItemClassification } from "../../../api/itemClassificationCodeApi";

export interface HSNNode {
  id: string;
  name: string;
  code?: string;
  /** Original code for group/parent nodes, retained only for search expansion lookups. */
  groupCode?: string;
  children?: HSNNode[];
}

export interface HSNLeaf {
  id: string;
  name: string;
  code: string;
  trail: string[];
}

export function buildTreeFromJson(data: any[]): HSNNode[] {
  const sortedData = [...data].sort(
    (a, b) => parseInt(a.itemClsLvl) - parseInt(b.itemClsLvl)
  );

  const tree: HSNNode[] = [];
  const map = new Map<string, HSNNode>();

  for (const item of sortedData) {
    const level = parseInt(item.itemClsLvl);
    const code = item.itemClsCd;
    const name = item.itemClsNm;

    const node: HSNNode = { id: item.id.toString(), name, code, children: [] };
    map.set(code, node);

    if (level === 1) {
      tree.push(node);
    } else {
      let parentCode = "";
      if (level === 2) parentCode = code.substring(0, 2) + "000000";
      else if (level === 3) parentCode = code.substring(0, 4) + "0000";
      else if (level === 4) parentCode = code.substring(0, 6) + "00";
      else if (level === 5) parentCode = code.substring(0, 8);

      const parent = map.get(parentCode);
      if (parent) parent.children!.push(node);
      else tree.push(node);
    }
  }

  function cleanup(nodes: HSNNode[]) {
    for (const node of nodes) {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children && node.children.length > 0) {
        node.groupCode = node.code;
        delete node.code;
        cleanup(node.children);
      }
    }
  }
  cleanup(tree);

  return tree;
}

export function getChildrenAtPath(tree: HSNNode[], path: string[]): HSNNode[] {
  let nodes = tree;
  for (const id of path) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return [];
    nodes = node.children ?? [];
  }
  return nodes;
}

export function getBreadcrumbNames(tree: HSNNode[], path: string[]): string[] {
  let nodes = tree;
  const names: string[] = [];
  for (const id of path) {
    const node = nodes.find((n) => n.id === id);
    if (!node) break;
    names.push(node.name);
    nodes = node.children ?? [];
  }
  return names;
}

/**
 * Maps every code (leaf or group) to its resolved list of selectable leaves.
 * - Leaf code -> a single-item array containing itself, with trail.
 * - Group code -> all descendant leaves under it, with trail.
 * Used to expand a backend search match into real, selectable HSN codes,
 * whether the match landed on a leaf or an intermediate category.
 */
export function buildCodeExpansionMap(tree: HSNNode[]): Map<string, HSNLeaf[]> {
  const map = new Map<string, HSNLeaf[]>();

  function collectLeaves(nodes: HSNNode[], trail: string[]): HSNLeaf[] {
    let leaves: HSNLeaf[] = [];
    for (const node of nodes) {
      if (node.code && !node.children) {
        leaves.push({ id: node.id, name: node.name, code: node.code, trail });
      } else if (node.children) {
        leaves = leaves.concat(collectLeaves(node.children, [...trail, node.name]));
      }
    }
    return leaves;
  }

  function walk(nodes: HSNNode[], trail: string[]) {
    for (const node of nodes) {
      if (node.code && !node.children) {
        map.set(node.code, [{ id: node.id, name: node.name, code: node.code, trail }]);
      } else if (node.children) {
        const groupTrail = [...trail, node.name];
        if (node.groupCode) {
          map.set(node.groupCode, collectLeaves(node.children, groupTrail));
        }
        walk(node.children, groupTrail);
      }
    }
  }

  walk(tree, []);
  return map;
}

export function toLegacyShape(items: ItemClassification[]) {
  return items
    .filter((i) => i.is_active)
    .map((i) => ({
      id: i.id,
      itemClsCd: i.class_code,
      itemClsNm: i.class_name,
      itemClsLvl: i.class_level,
    }));
}

export function toSearchLeaf(items: ItemClassification[]): HSNLeaf[] {
  return items
    .filter((i) => i.is_active)
    .map((i) => ({
      id: i.id,
      name: i.class_name,
      code: i.class_code,
      trail: [],
    }));
}