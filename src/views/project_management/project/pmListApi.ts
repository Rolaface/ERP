/**
 * Builds a `fetchRows` function for usePmList.
 *
 * usePmList calls  config.fetchRows(search)  and expects a plain array of rows.
 * It does the filtering, sorting and paging itself, so we only load rows here.
 *
 * TODO: this uses the standard Frappe REST endpoint with the session cookie.
 * If your project uses an axios instance / token (like getAllProjects does),
 * replace the fetch() inside this one function. Nothing else needs to change.
 */
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
      // showApiError in usePmList will display this message
      throw new Error(
        json?.exception || json?.message || `Failed to load ${doctype}`,
      );
    }

    return (json?.data ?? []) as T[];
  };