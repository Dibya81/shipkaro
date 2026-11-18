import { checkPassword, newSessionValue, SESSION_DAYS, sessionCookieHeader } from "@/lib/server/admin";

/** POST { password } logs the admin in (sets a signed cookie). DELETE logs out. */

export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    /* fall through to the failure response */
  }
  if (!password || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ ok: false }, { status: 401 });
  }
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": sessionCookieHeader(newSessionValue(), SESSION_DAYS * 86_400) } },
  );
}

export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookieHeader("", 0) } });
}
