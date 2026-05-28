export interface Env {
  DB: any;
  ASSETS: any;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const parseJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

const getDefaultStatus = (dateString: string) => {
  const date = new Date(dateString);
  return date.getDay() === 0 ? 'appointment_only' : 'open';
};

async function handleAvailability(request: Request, env: Env) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (request.method === 'GET') {
    if (!from || !to) {
      return json({ error: 'Missing from/to query parameters' }, 400);
    }

    const result = await env.DB.prepare(
      `SELECT id, date, status, created_at, updated_at FROM charisma_availability WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
    )
      .bind(from, to)
      .all();

    return json(result.results || []);
  }

  if (request.method === 'POST') {
    const body = await parseJson(request);
    if (!body || !body.date || !body.status) {
      return json({ error: 'Missing date or status' }, 400);
    }

    const date = formatDate(body.date);
    const status = body.status;
    const defaultStatus = getDefaultStatus(date);

    if (status === 'open' && defaultStatus === 'open') {
      await env.DB.prepare('DELETE FROM charisma_availability WHERE date = ?').bind(date).run();
      return json({ success: true });
    }

    await env.DB.prepare(
      `INSERT INTO charisma_availability (date, status, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now')) ON CONFLICT(date) DO UPDATE SET status = excluded.status, updated_at = datetime('now')`,
    )
      .bind(date, status)
      .run();

    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function handleBulkAvailability(request: Request, env: Env) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const body = await parseJson(request);
  if (!body || !body.from || !body.to || !body.status) {
    return json({ error: 'Missing from, to, or status' }, 400);
  }

  const from = formatDate(body.from);
  const to = formatDate(body.to);
  const status = body.status;

  if (new Date(from) > new Date(to)) {
    return json({ error: 'Invalid date range' }, 400);
  }

  const statements = [];
  let cursor = new Date(from);
  while (cursor <= new Date(to)) {
    const iso = formatDate(cursor);
    const defaultStatus = getDefaultStatus(iso);
    if (status === 'open' && defaultStatus === 'open') {
      statements.push({ sql: 'DELETE FROM charisma_availability WHERE date = ?', binds: [iso] });
    } else {
      statements.push({
        sql: `INSERT INTO charisma_availability (date, status, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now')) ON CONFLICT(date) DO UPDATE SET status = excluded.status, updated_at = datetime('now')`,
        binds: [iso, status],
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const statement of statements) {
    await env.DB.prepare(statement.sql).bind(...statement.binds).run();
  }

  return json({ success: true });
}

async function handleBookings(request: Request, env: Env) {
  if (request.method === 'GET') {
    const result = await env.DB.prepare(
      `SELECT id, client_name, client_phone, service_requested, preferred_date, status, deposit_paid, notes, created_at, updated_at FROM charisma_bookings ORDER BY created_at DESC`,
    ).all();

    return json(result.results || []);
  }

  if (request.method === 'POST') {
    const body = await parseJson(request);
    if (
      !body ||
      !body.client_name ||
      !body.client_phone ||
      !body.service_requested ||
      !body.preferred_date ||
      !body.status ||
      typeof body.deposit_paid !== 'boolean'
    ) {
      return json({ error: 'Missing booking fields' }, 400);
    }

    const preferredDate = formatDate(body.preferred_date);

    const bookingStmt = env.DB.prepare(
      `INSERT INTO charisma_bookings (client_name, client_phone, service_requested, preferred_date, status, deposit_paid, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    ).bind(
      body.client_name,
      body.client_phone,
      body.service_requested,
      preferredDate,
      body.status,
      body.deposit_paid ? 1 : 0,
      body.notes || '',
    );

    const availabilityStmt = env.DB.prepare(
      `INSERT INTO charisma_availability (date, status, created_at, updated_at) VALUES (?, 'fully_booked', datetime('now'), datetime('now')) ON CONFLICT(date) DO UPDATE SET status = excluded.status, updated_at = datetime('now')`,
    ).bind(preferredDate);

    const results = await env.DB.batch([bookingStmt, availabilityStmt]);
    const bookingResult = results[0];

    return json({ success: true, id: bookingResult?.lastRowID });
  }

  return json({ error: 'Method not allowed' }, 405);
}

async function handleBookingStatus(request: Request, env: Env, id: string) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const body = await parseJson(request);
  if (!body || !body.status) {
    return json({ error: 'Missing status' }, 400);
  }

  await env.DB.prepare('UPDATE charisma_bookings SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(body.status, id)
    .run();

  return json({ success: true });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/availability/bulk')) {
      return handleBulkAvailability(request, env);
    }

    if (pathname.startsWith('/api/availability')) {
      return handleAvailability(request, env);
    }

    if (pathname === '/api/bookings') {
      return handleBookings(request, env);
    }

    if (pathname.match(/^\/api\/bookings\/[^/]+\/status$/)) {
      const parts = pathname.split('/');
      const id = parts[3];
      return handleBookingStatus(request, env, id);
    }

    return env.ASSETS.fetch(request);
  },
};
