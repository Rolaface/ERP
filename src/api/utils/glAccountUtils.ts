export function getGLNameWithoutAbbreviation(glName: string | null | undefined): string {
  if (!glName || typeof glName !== "string") {
    return glName || "";
  }

  const hyphenIndex = glName.lastIndexOf(" - ");

  if (hyphenIndex === -1) {
    return glName.trim();
  }

  return glName.substring(0, hyphenIndex).trim();
}

export function cleanGLNameList<T extends Record<string, any>>(
  list: T[],
  key: keyof T = "label" as keyof T,
): T[] {
  if (!Array.isArray(list)) return list;

  return list.map((item) => ({
    ...item,
    [key]: getGLNameWithoutAbbreviation(item[key]),
  }));
}