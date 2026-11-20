"""Sellbird -> ShipKaro bridge.

A tiny MCP server (stdio) that Sellbird starts when a prospect says yes to the
offer (see `handoff` in sellbird.local.yaml). Its one tool, `create_lead`,
posts the person to ShipKaro's /api/leads, which saves them in Firestore
(admin → Requests) and pings Telegram.

Settings are read from outreach/sellbird/.env:
  SHIPKARO_URL             e.g. https://shipkaro-omega.vercel.app  (or http://localhost:3000)
  SHIPKARO_OUTREACH_TOKEN  same value as OUTREACH_TOKEN in ShipKaro's env
"""

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from mcp.server.mcpserver import MCPServer

load_dotenv(Path(__file__).resolve().parent / "sellbird" / ".env")

mcp = MCPServer("shipkaro")


@mcp.tool()
def create_lead(name: str = "", email: str = "", company: str = "", website: str = "",
                title: str = "", offer: str = "", reply: str = "") -> str:
    """Add a prospect who accepted the offer to ShipKaro's admin Requests."""
    base = os.environ.get("SHIPKARO_URL", "").rstrip("/")
    token = os.environ.get("SHIPKARO_OUTREACH_TOKEN", "")
    if not base or not token:
        raise RuntimeError("SHIPKARO_URL or SHIPKARO_OUTREACH_TOKEN isn't set in outreach/sellbird/.env")
    r = httpx.post(
        f"{base}/api/leads",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": name, "email": email, "company": company, "website": website,
              "title": title, "offer": offer, "reply": reply},
        timeout=20,
    )
    if r.status_code != 200:
        raise RuntimeError(f"ShipKaro answered {r.status_code}: {r.text[:200]}")
    return "Saved to the ShipKaro dashboard. Dibya will follow up with the mockup."


if __name__ == "__main__":
    mcp.run("stdio")
