// Requires GOOGLE_GENERATIVE_AI_API_KEY in the environment. Prints no credentials.
const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!key) throw new Error("Configure GOOGLE_GENERATIVE_AI_API_KEY first");
let url =
  "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000";
const available = new Set();
do {
  const r = await fetch(url, {
    headers: { "x-goog-api-key": key },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Model discovery failed (${r.status})`);
  const body = await r.json();
  for (const m of body.models || [])
    if (m.supportedGenerationMethods?.includes("generateContent"))
      available.add(m.name.replace("models/", ""));
  url = body.nextPageToken
    ? `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&pageToken=${encodeURIComponent(body.nextPageToken)}`
    : null;
} while (url);
for (const id of ["gemini-3.8-flash", "gemini-3.5-flash-lite"]) {
  console.log(`${id}: ${available.has(id) ? "available" : "NOT AVAILABLE"}`);
  if (!available.has(id)) process.exitCode = 1;
}
