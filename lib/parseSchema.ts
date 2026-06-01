type SchemaNode = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * HTML içindeki application/ld+json bloklarını ayrıştırır.
 */
export function extractJsonLdNodes(html: string): SchemaNode[] {
  const nodes: SchemaNode[] = [];
  const pattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    try {
      const parsed = JSON.parse(match[1].trim()) as SchemaNode | SchemaNode[];
      if (Array.isArray(parsed)) {
        nodes.push(...parsed);
      } else if (parsed["@graph"]) {
        nodes.push(...asArray(parsed["@graph"] as SchemaNode | SchemaNode[]));
      } else {
        nodes.push(parsed);
      }
    } catch {
      // Geçersiz JSON-LD yoksayılır.
    }
  }

  return nodes;
}

export function findSchemaNode(
  nodes: SchemaNode[],
  type: string
): SchemaNode | undefined {
  return nodes.find((node) => {
    const nodeType = node["@type"];
    if (typeof nodeType === "string") return nodeType === type;
    if (Array.isArray(nodeType)) return nodeType.includes(type);
    return false;
  });
}

export function schemaString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function schemaImage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

export function schemaBrandName(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return schemaString((value as { name?: unknown }).name);
  }
  return undefined;
}

/**
 * "Kitap Adı - Yazar Adı" biçimini ayırır.
 */
export function splitTitleAuthor(fullName: string): {
  title: string;
  author?: string;
} {
  const trimmed = fullName.trim();
  const sep = trimmed.lastIndexOf(" - ");
  if (sep > 0) {
    return {
      title: trimmed.slice(0, sep).trim(),
      author: trimmed.slice(sep + 3).trim(),
    };
  }
  return { title: trimmed };
}
