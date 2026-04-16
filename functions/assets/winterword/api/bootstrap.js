export async function onRequest(context) {
  try {
    const { request } = context;

    // Expect JSON body
    const body = await request.json();
    const { slug } = body;

    // Load the bootstrap JSON from your assets folder
    const url = new URL(`../../../bootstrap/${slug}.json`, import.meta.url);
    const json = await fetch(url).then(r => r.json());

    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Bootstrap failed", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
