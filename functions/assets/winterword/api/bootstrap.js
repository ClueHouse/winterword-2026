fetch("/assets/winterword/api/bootstrap", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ slug })
});
