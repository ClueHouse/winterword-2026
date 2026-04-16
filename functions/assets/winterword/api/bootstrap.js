export async function onRequest(context) {
  try {
    const json = {
      entry: "/twenty26/engine.js",
      slug: "default",
      game_file: "/assets/winterword/games/default.json"
    };

    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Bootstrap failed",
        details: err.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
