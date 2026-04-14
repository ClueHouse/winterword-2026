export async function onRequestPost(context) {
  return Response.json({
    ok: true,
    slug: "testslug",
    game_file: "/games/testslug.json"
  });
}
