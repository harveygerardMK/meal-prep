export type TikTokOEmbed = {
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
  html?: string;
};

export function isAllowedTikTokUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      (parsed.hostname === "www.tiktok.com" ||
        parsed.hostname === "tiktok.com" ||
        parsed.hostname === "vm.tiktok.com" ||
        parsed.hostname.endsWith(".tiktok.com"))
    );
  } catch {
    return false;
  }
}

export async function fetchTikTokOEmbed(url: string): Promise<TikTokOEmbed | null> {
  if (!isAllowedTikTokUrl(url)) {
    throw new Error("Only TikTok URLs are supported");
  }
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      html?: string;
    };
    if (!data.title) return null;
    return {
      title: data.title,
      authorName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
      html: data.html,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
