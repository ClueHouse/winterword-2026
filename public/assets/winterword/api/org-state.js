// File: functions/assets/winterword/api/org-state.js
// Cloudflare Pages Function version

function parseDate(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function asPositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function asNonNegativeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

function isWeekdayUtc(ms) {
  const day = new Date(ms).getUTCDay();
  return day >= 1 && day <= 5;
}

function startOfUtcDay(ms) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function countWeekdayDrops(startMs, nowMs) {
  if (nowMs < startMs) return 0;

  const startDayMs = startOfUtcDay(startMs);
  const nowDayMs = startOfUtcDay(nowMs);

  let count = 0;
  for (let dayMs = startDayMs; dayMs <= nowDayMs; dayMs += 86400000) {
    if (!isWeekdayUtc(dayMs)) continue;
    if (dayMs === startDayMs && nowMs < startMs) continue;
    count += 1;
  }

  return count;
}

function countIntervalDrops(startMs, nowMs, intervalMs) {
  if (!intervalMs || nowMs < startMs) return 0;
  return Math.floor((nowMs - startMs) / intervalMs) + 1;
}

function computeCurrentClue(startMs, frequency, nowMs, totalClues) {
  if (!startMs || !frequency || !totalClues) return 0;
  if (nowMs < startMs) return 0;

  let current = 0;

  switch (frequency) {
    case "weekly":
      current = countIntervalDrops(startMs, nowMs, 7 * 24 * 60 * 60 * 1000);
      break;
    case "hourly":
      current = countIntervalDrops(startMs, nowMs, 60 * 60 * 1000);
      break;
    case "quarter_hourly":
      current = countIntervalDrops(startMs, nowMs, 15 * 60 * 1000);
      break;
    case "daily_weekdays":
      current = countWeekdayDrops(startMs, nowMs);
      break;
    default:
      current = 0;
      break;
  }

  if (current < 0) current = 0;
  if (current > totalClues) current = totalClues;
  return current;
}

export async function onRequest(context) {
  const { request, env } = context;

  // CORS + method handling
  const origin = request.headers.get("Origin") || "*";

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (request.method !== "GET") {
    return Response.json(
      {
        ok: false,
        error: "Method not allowed"
      },
      {
        status: 405,
        headers: {
          "Access-Control-Allow-Origin": origin
        }
      }
    );
  }

  const url = new URL(request.url);
  const org = url.searchParams.get("org")?.trim() || "";

  if (!org) {
    return Response.json(
      {
        ok: false,
        error: "Missing or invalid 'org' parameter"
      },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": origin
        }
      }
    );
  }

  const AIRTABLE_TOKEN = env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = env.AIRTABLE_TABLE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return Response.json(
      {
        ok: false,
        error: "Server misconfigured: missing Airtable environment variables"
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": origin
        }
      }
    );
  }

  const safeOrg = org.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const formula = encodeURIComponent(`{slug}="${safeOrg}"`);
  const airtableUrl =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}` +
    `?filterByFormula=${formula}&maxRecords=1`;

  try {
    const airtableRes = await fetch(airtableUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        Accept: "application/json"
      }
    });

    if (!airtableRes.ok) {
      const bodyText = await airtableRes.text().catch(() => "");
      return Response.json(
        {
          ok: false,
          error: "Airtable request failed",
          airtable_status: airtableRes.status,
          airtable_body: bodyText || undefined
        },
        {
          status: 502,
          headers: {
            "Access-Control-Allow-Origin": origin
          }
        }
      );
    }

    const data = await airtableRes.json();
    const record = Array.isArray(data.records) ? data.records[0] : null;
    const f = record?.fields || null;

    if (!f) {
      return Response.json(
        {
          ok: false,
          error: "No matching organisation found"
        },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": origin
          }
        }
      );
    }

    const nowMs = Date.now();
    const status = typeof f.status === "string" ? f.status.trim() : "auto";
    const slug = typeof f.slug === "string" ? f.slug : org;
    const orgName = typeof f.org_name === "string" ? f.org_name : "";
    const timezone = typeof f.timezone === "string" ? f.timezone : "";
    const updatesContent =
      typeof f.updates_content === "string" ? f.updates_content : "";
    const isVisible = f.is_visible === true;

    const seasonStartMs = parseDate(f.season_start);
    const seasonEndMs = parseDate(f.season_end);
    const totalClues = asPositiveInt(f.total_clues);
    const overrideClue = asNonNegativeInt(f.current_clue_override);

    let currentClue =
      overrideClue !== null
        ? Math.min(overrideClue, totalClues)
        : computeCurrentClue(seasonStartMs, f.drop_frequency, nowMs, totalClues);

    let seasonState = "auto";
    let isComplete = false;

    if (status === "complete") {
      seasonState = "complete";
      isComplete = true;
      currentClue = totalClues;
    } else if (status === "live") {
      seasonState = "live";
      isComplete = false;
    } else {
      seasonState = "auto";

      if (seasonEndMs !== null && nowMs >= seasonEndMs) {
        isComplete = true;
        currentClue = totalClues;
      } else if (totalClues > 0 && currentClue >= totalClues) {
        isComplete = true;
        currentClue = totalClues;
      }
    }

    const unavailable = !isVisible;

    return Response.json(
      {
        ok: true,
        org: slug,
        slug,
        org_name: orgName,
        timezone,
        status,
        is_visible: isVisible,
        unavailable,
        season_start: f.season_start ?? null,
        season_end: f.season_end ?? null,
        drop_frequency: f.drop_frequency ?? null,
        total_clues: totalClues,
        current_clue_override: overrideClue,
        current_clue: currentClue,
        updates_content: updatesContent,
        is_complete: isComplete,
        season_state: isComplete ? "complete" : "live",
        now_iso: new Date(nowMs).toISOString()
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("org-state error:", error);

    return Response.json(
      {
        ok: false,
        error: "Server error"
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": origin
        }
      }
    );
  }
}
