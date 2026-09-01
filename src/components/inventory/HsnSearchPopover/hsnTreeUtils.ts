import type { ItemClassification } from "../../../api/itemClassificationCodeApi";

/** Level at which the tree starts for the user (Level 1-2 are hidden as
 *  navigation noise, shown only as ancestor-path context). Hardcoded for
 *  now; will move to per-tenant config once the backend exposes it. */
export const ROOT_LEVEL = 3;

export interface TrailEntry {
  name: string;
  level: number;
}

export interface HSNNode {
  id: string;
  name: string;
  code?: string;
  groupCode?: string;
  children?: HSNNode[];
  level?: number;
  ancestorTrail?: TrailEntry[];
}

export interface HSNLeaf {
  id: string;
  name: string;
  code: string;
  level: number;
  trail: TrailEntry[];
}

/** One searchable unit: either a leaf itself, or a category whose name
 *  should also be matchable, resolving to all its selectable descendants. */
export interface SearchEntry {
  name: string;
  code?: string;
  leaves: HSNLeaf[];
}

export function buildTreeFromJson(data: any[], rootLevel: number = ROOT_LEVEL): HSNNode[] {
  const sortedData = [...data].sort(
    (a, b) => parseInt(a.itemClsLvl) - parseInt(b.itemClsLvl)
  );

  const fullTree: HSNNode[] = [];
  const map = new Map<string, HSNNode>();

  for (const item of sortedData) {
    const level = parseInt(item.itemClsLvl);
    const code = item.itemClsCd;
    const name = item.itemClsNm;

    const node: HSNNode = { id: item.id.toString(), name, code, children: [], level };
    map.set(code, node);

    if (level === 1) {
      fullTree.push(node);
    } else {
      let parentCode = "";
      if (level === 2) parentCode = code.substring(0, 2) + "000000";
      else if (level === 3) parentCode = code.substring(0, 4) + "0000";
      else if (level === 4) parentCode = code.substring(0, 6) + "00";
      else if (level === 5) parentCode = code.substring(0, 8);

      const parent = map.get(parentCode);
      if (parent) parent.children!.push(node);
      else fullTree.push(node);
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
  cleanup(fullTree);

  const roots: HSNNode[] = [];
  function collectRoots(nodes: HSNNode[], trail: TrailEntry[]) {
    for (const node of nodes) {
      if (node.level === rootLevel) {
        node.ancestorTrail = trail;
        roots.push(node);
      } else if ((node.level ?? 0) < rootLevel && node.children) {
        collectRoots(node.children, [...trail, { name: node.name, level: node.level! }]);
      } else if ((node.level ?? 0) > rootLevel) {
        // parent chain broke before reaching rootLevel (orphaned record) — still show it
        node.ancestorTrail = trail;
        roots.push(node);
      }
    }
  }
  collectRoots(fullTree, []);

  return roots;
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

/** Builds the searchable index once per tree load: one entry per leaf
 *  (matchable by name + code) and one entry per category (matchable by
 *  name, resolving to every selectable leaf beneath it). This is what lets
 *  searching a folder name like "Histology equipment" return its contents
 *  instead of "no matches". */
export function buildSearchIndex(tree: HSNNode[]): SearchEntry[] {
  const entries: SearchEntry[] = [];

  function collectLeaves(nodes: HSNNode[], trail: TrailEntry[]): HSNLeaf[] {
    let leaves: HSNLeaf[] = [];
    for (const node of nodes) {
      if (node.code && !node.children) {
        leaves.push({ id: node.id, name: node.name, code: node.code, level: node.level!, trail });
      } else if (node.children) {
        leaves = leaves.concat(
          collectLeaves(node.children, [...trail, { name: node.name, level: node.level! }])
        );
      }
    }
    return leaves;
  }

  function walk(nodes: HSNNode[], trail: TrailEntry[]) {
    for (const node of nodes) {
      if (node.code && !node.children) {
        entries.push({
          name: node.name,
          code: node.code,
          leaves: [{ id: node.id, name: node.name, code: node.code, level: node.level!, trail }],
        });
      } else if (node.children) {
        const groupTrail = [...trail, { name: node.name, level: node.level! }];
        entries.push({ name: node.name, leaves: collectLeaves(node.children, groupTrail) });
        walk(node.children, groupTrail);
      }
    }
  }

  for (const root of tree) {
    walk([root], root.ancestorTrail ?? []);
  }

  return entries;
}

/** Ranks matches so the most relevant results come first instead of
 *  whatever order the tree happens to be in: exact name/code match, then
 *  starts-with, then contains, then "all words present somewhere" for
 *  multi-word queries. */
export function searchLeaves(index: SearchEntry[], query: string): HSNLeaf[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  function score(text: string): number {
    const t = text.toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(q)) return 60;
    if (tokens.length > 1 && tokens.every((tok) => t.includes(tok))) return 40;
    return 0;
  }

  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    const nameScore = score(entry.name);
    const codeScore = entry.code ? score(entry.code) : 0;
    const best = Math.max(nameScore, codeScore);
    if (best > 0) scored.push({ entry, score: best });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  const seen = new Set<string>();
  const results: HSNLeaf[] = [];
  for (const { entry } of scored) {
    for (const leaf of entry.leaves) {
      if (seen.has(leaf.code)) continue;
      seen.add(leaf.code);
      results.push(leaf);
    }
  }

  return results;
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