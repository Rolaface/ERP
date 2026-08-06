export async function downloadStaticTemplate(fileName: string): Promise<{
  blob: Blob;
  fileName: string;
}> {
  // Encode each path segment individually — encodeURIComponent on the
  // whole string would turn "/" into "%2F" and break nested paths.
  const encodedPath = fileName.split("/").map(encodeURIComponent).join("/");

  const response = await fetch(`/Import%20Templates/${encodedPath}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Template not found: ${fileName}`);
  }


  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(
      `Template not found: ${fileName} — server returned HTML. ` +
        `Check the file exists at public/Import Templates/${fileName}`,
    );
  }

  return {
    blob: await response.blob(),
    fileName: fileName.split("/").pop() ?? fileName,
  };
}