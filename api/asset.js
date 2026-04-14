export async function onRequestGet(context) {
  try {
    const { request, env } = context;

    const url = new URL(request.url);
    const path = url.searchParams.get("path");

    if (!path) {
      return new Response("Missing path", { status: 400 });
    }

    // Fetch static asset from your repo
    const asset = await env.ASSETS.fetch(path);

    if (!asset || asset.status === 404) {
      return new Response("Asset not found", { status: 404 });
    }

    return asset;

  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
