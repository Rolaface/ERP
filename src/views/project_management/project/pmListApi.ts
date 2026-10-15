export const makeFetchRows =
  <T>(doctype: string, fields: string[], searchFields: string[]) =>
  async (search?: string): Promise<T[]> => {
    const params = new URLSearchParams();
    params.set("fields", JSON.stringify(fields));
    params.set("limit_page_length", "0"); // 0 = all rows (usePmList pages them)

    if (search) {
      params.set(
        "or_filters",
        JSON.stringify(
          searchFields.map((f) => [f, "like", `%${search}%`]),
        ),
      );
    }

    const res = await fetch(
      `/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`,
      { credentials: "include" },
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      
      throw new Error(
        json?.exception || json?.message || `Failed to load ${doctype}`,
      );
    }

    return (json?.data ?? []) as T[];
  };