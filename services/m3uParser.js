function parseAttributes(line) {
  const attrs = {};

  const regex = /([\w-]+)="([^"]*)"/g;

  let match;

  while ((match = regex.exec(line)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

function parseM3U(content) {
  const categories = {};
  const lines = content.split(/\r?\n/);

  let current = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const attrs = parseAttributes(line);

      const name = line.includes(",")
        ? line.substring(line.lastIndexOf(",") + 1).trim()
        : "Sin nombre";

      current = {
        name,
        url: "",
        group: attrs["group-title"] || "Sin categoría",
        logo: attrs["tvg-logo"] || "",
        tvgId: attrs["tvg-id"] || "",
        tvgName: attrs["tvg-name"] || "",
        tvgShift: attrs["tvg-shift"] || "",
      };

      continue;
    }

    if (
      current &&
      !line.startsWith("#")
    ) {
      current.url = line;

      if (!categories[current.group]) {
        categories[current.group] = [];
      }

      categories[current.group].push(current);

      current = null;
    }
  }

  return Object.keys(categories)
    .sort()
    .map((category) => ({
      name: category,
      channels: categories[category].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
}

module.exports = {
  parseM3U,
};