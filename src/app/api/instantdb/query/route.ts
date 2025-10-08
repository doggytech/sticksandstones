import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // Log incoming request for debugging (visible in the Next dev server terminal)
  try {
    console.log('[instantdb proxy] incoming request', {
      method: 'POST',
      url: request.url,
      hasBody: Boolean(body),
    });
  } catch (e) {
    // ignore logging errors
  }

  if (!body) {
    console.warn('[instantdb proxy] invalid body');
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const INST_API = process.env.INSTANTDB_RUNTIME_URL || 'https://api.instantdb.com/runtime/query';
  const APP_ID = process.env.INSTANT_DB_APP_ID || process.env.NEXT_PUBLIC_INSTANT_APP_ID;

  try {
    // Try a few candidate upstream URLs in case the runtime endpoint path differs
    const candidates = [
      INST_API,
      // common alternative forms
      INST_API.replace('/runtime/query', '/runtime/v1/query'),
      `https://api.instantdb.com/runtime/apps/${APP_ID}/query`,
      `https://api.instantdb.com/runtime/${APP_ID}/query`,
    ];

  let lastResp: Response | null = null;
  let lastText = '';
  let successJson: unknown = null;
    let successStatus = 502;

    for (const url of candidates) {
      try {
        console.log('[instantdb proxy] trying upstream', { url, APP_ID_MASK: String(APP_ID).slice(0, 8) + '...' });
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APP_ID}`,
          },
          body: JSON.stringify(body),
        });

        const text = await resp.text();
        lastResp = resp;
        lastText = text;

        console.log('[instantdb proxy] attempt status', { url, status: resp.status });

        if (resp.ok) {
          try { successJson = JSON.parse(text); } catch (e) { successJson = { raw: text }; }
          successStatus = resp.status;
          break;
        }
        } catch {
          // Ignore per-attempt network/logging errors; continue to next candidate
        // continue to next candidate
      }
    }

    if (successJson !== null) {
      console.log('[instantdb proxy] upstream success', { status: successStatus });
      return NextResponse.json(successJson, { status: successStatus });
    }

    // No successful upstream; return last attempt's body/status or generic 502
    if (lastResp) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(lastText);
      } catch {
        parsed = { raw: lastText };
      }
      console.warn('[instantdb proxy] no successful upstream, returning last attempt', { status: lastResp.status });
      return NextResponse.json(parsed as Record<string, unknown>, { status: lastResp.status });
    }

    return NextResponse.json({ error: 'No upstream response' }, { status: 502 });
  } catch (err: unknown) {
    const message = typeof err === 'object' && err !== null && 'message' in err ? String((err as { message?: unknown }).message) : String(err);
    console.error('[instantdb proxy] error forwarding request', message);
    return NextResponse.json({ error: message || 'proxy error' }, { status: 502 });
  }
}
