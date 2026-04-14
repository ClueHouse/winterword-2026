export async function onRequestPost(context) {
  return Response.json({
    ok: true,
    entry: "/twenty26/engine.js",
    slug: "testslug",
    game_file: "/games/testslug.json"
  });
}
