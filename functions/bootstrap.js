export async function onRequestPost(context) {
  const { request } = context;
  const body = await request.json();

  return Response.json({
    ok: true,
    entry: "/twenty26/engine.js"
  });
}
