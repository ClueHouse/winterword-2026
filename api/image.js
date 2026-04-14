export async function onRequestGet(context) {
  try {
    const { request, env } = context;

    const url = new URL(request.url);
    const src = url.searchParams.get("src");

    if (!src) {
      return new Response("Missing src", { status: 400 });
    }

    // Proxy external image through Cloudflare
    const img = await fetch(src);

    if (!img || img.status === 404) {
      return new Response("Image not found", { status: 404 });
    }

    return img;

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
