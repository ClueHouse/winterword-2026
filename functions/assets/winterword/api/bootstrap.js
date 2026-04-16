export async function onRequest(context) {
  try {
    // Always load bootstrap.json
    const url = new URL(`../../../bootstrap/bootstrap.json`, import.meta.url);
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
