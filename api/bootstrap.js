export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    const { slug } = await request.json();

    if (!slug) {
      return new Response(JSON.stringify({ ok: false, error: "Missing slug" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // Engine path is fixed for WinterWord 2026
    const entry = "/js/twenty26/engine.js";

    return new Response(
      JSON.stringify({
        ok: true,
        entry
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
