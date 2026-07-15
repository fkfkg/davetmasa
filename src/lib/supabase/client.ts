'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    electronAPI?: any;
  }
}

type LocalUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
  };
};

type Filter = {
  column: string;
  value: unknown;
  operator?: 'eq' | 'in';
};

const LOCAL_USER_KEY = 'davetmasa_local_user';
const LOCAL_TABLE_PREFIX = 'davetmasa_table_';

function createLocalUser(): LocalUser {
  return {
    id: 'local-user',
    email: 'yerel@davetmasa.local',
    user_metadata: {
      full_name: 'Yerel Kullanıcı',
    },
  };
}

let globalDb: any = null;
let dbLoadPromise: Promise<any> | null = null;

async function getDb() {
  if (globalDb) return globalDb;
  if (!dbLoadPromise) {
    dbLoadPromise = fetch('/api/data').then(res => res.json()).catch(() => ({}));
  }
  globalDb = await dbLoadPromise;
  if (!globalDb.tables) globalDb.tables = {};
  return globalDb;
}

async function saveDb() {
  if (!globalDb) return;
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(globalDb)
    });
  } catch (err) {
    console.error('Kayıt hatası', err);
  }
}

async function getLocalUser() {
  const db = await getDb();
  return db.user || null;
}

async function setLocalUser(user: LocalUser) {
  const db = await getDb();
  db.user = user;
  await saveDb();
  document.cookie = 'davetmasa_session=1; path=/; max-age=31536000; samesite=lax';
}

async function clearLocalUser() {
  const db = await getDb();
  db.user = null;
  await saveDb();
  document.cookie = 'davetmasa_session=; path=/; max-age=0; samesite=lax';
}

async function readTable(table: string): Promise<any[]> {
  const db = await getDb();
  return db.tables[table] || [];
}

async function writeTable(table: string, rows: any[]) {
  const db = await getDb();
  db.tables[table] = rows;
  await saveDb();
}

function applyFilters(rows: any[], filters: Filter[]) {
  return rows.filter((row) =>
    filters.every((filter) => {
      if (filter.operator === 'in') {
        return Array.isArray(filter.value) && filter.value.includes(row[filter.column]);
      }

      return row[filter.column] === filter.value;
    })
  );
}

function normalizeRow(table: string, payload: unknown) {
  const now = new Date().toISOString();
  const row = payload as Record<string, unknown>;

  return {
    id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
    created_at: typeof row.created_at === 'string' ? row.created_at : now,
    updated_at: now,
    status: table === 'events' && !row.status ? 'draft' : row.status,
    plan: table === 'organizations' && !row.plan ? 'free' : row.plan,
    ...row,
  };
}

function createQuery(table: string) {
  const filters: Filter[] = [];
  let orderColumn = '';
  let orderAscending = true;
  let limitCount: number | null = null;

  // We accumulate mutations instead of immediately writing them, 
  // so that `.single()` or `.then()` can await the DB operation.
  let pendingInsert: any[] | null = null;
  let pendingUpdate: Record<string, unknown> | null = null;
  let pendingDelete = false;
  let insertedRows: any[] | null = null;

  const execute = async () => {
    let rows = await readTable(table);

    if (pendingInsert) {
      insertedRows = pendingInsert.map(item => normalizeRow(table, item));
      rows = [...rows, ...insertedRows];
      await writeTable(table, rows);
    }
    
    if (pendingUpdate) {
      rows = rows.map(row => 
        applyFilters([row], filters).length 
          ? { ...row, ...pendingUpdate, updated_at: new Date().toISOString() } 
          : row
      );
      await writeTable(table, rows);
    }

    if (pendingDelete) {
      rows = rows.filter(row => applyFilters([row], filters).length === 0);
      await writeTable(table, rows);
    }

    const source = pendingInsert ? insertedRows : rows;
    let filtered = applyFilters(source || [], filters);

    if (orderColumn) {
      filtered = [...filtered].sort((a, b) => {
        const left = a[orderColumn] ?? '';
        const right = b[orderColumn] ?? '';
        return orderAscending
          ? String(left).localeCompare(String(right), 'tr')
          : String(right).localeCompare(String(left), 'tr');
      });
    }

    return limitCount === null ? filtered : filtered.slice(0, limitCount);
  };

  const query: any = {
    select(...args: unknown[]) {
      void args;
      return query;
    },
    eq(column: string, value: unknown) {
      filters.push({ column, value, operator: 'eq' });
      return query;
    },
    in(column: string, values: unknown[]) {
      filters.push({ column, value: values, operator: 'in' });
      return query;
    },
    order(column: string, options?: { ascending?: boolean }) {
      orderColumn = column;
      orderAscending = options?.ascending ?? true;
      return query;
    },
    limit(count: number) {
      limitCount = count;
      return query;
    },
    async single() {
      const rows = await execute();
      return { data: rows[0] ?? null, error: null };
    },
    insert(payload: unknown) {
      pendingInsert = Array.isArray(payload) ? payload : [payload];
      return query;
    },
    update(payload: Record<string, unknown>) {
      pendingUpdate = payload;
      return query;
    },
    delete() {
      pendingDelete = true;
      return query;
    },
    then(resolve: (value: { data: any[]; error: null }) => void, reject?: (reason: unknown) => void) {
      execute()
        .then(rows => resolve({ data: rows, error: null }))
        .catch(reject);
    },
  };

  return query;
}

export function createClient() {
  return {
    auth: {
      async signInAnonymously() {
        const user = createLocalUser();
        await setLocalUser(user);
        return { data: { user }, error: null };
      },
      async getUser() {
        const user = await getLocalUser() ?? createLocalUser();
        if (!(await getLocalUser())) {
          await setLocalUser(user);
        }
        return { data: { user }, error: null };
      },
      async signOut() {
        await clearLocalUser();
        return { error: null };
      },
    },
    from(table: string) {
      return createQuery(table);
    },
    async rpc(name: string, params?: Record<string, unknown>): Promise<{ data: any; error: null }> {
      if (name === 'get_event_stats') {
        const eventId = String(params?.evt_id ?? '');
        const tables = (await readTable('tables')).filter((table) => table.event_id === eventId);
        const guests = (await readTable('guests')).filter((guest) => guest.event_id === eventId);
        const seatedGuests = guests.filter((guest) => Boolean(guest.table_id)).length;

        return {
          data: {
            total_guests: guests.length,
            seated_guests: seatedGuests,
            unseated_guests: guests.length - seatedGuests,
            total_tables: tables.length,
            total_capacity: tables.reduce((sum, table) => sum + (Number(table.capacity) || 0), 0),
            checked_in: guests.filter((guest) => guest.check_in_status === 'checked_in').length,
          },
          error: null,
        };
      }

      if (name === 'public_guest_lookup') {
        const slug = String(params?.lookup_slug ?? '');
        const searchName = String(params?.search_name ?? '').toLocaleLowerCase('tr');
        const events = await readTable('events');
        const event = events.find((item) => item.public_lookup_slug === slug);

        if (!event) {
          return { data: [], error: null };
        }

        const tables = await readTable('tables');
        const guests = await readTable('guests');
        const data = guests
          .filter((guest) => guest.event_id === event.id)
          .filter((guest) => String(guest.full_name ?? '').toLocaleLowerCase('tr').includes(searchName))
          .map((guest) => {
            const table = tables.find((item) => item.id === guest.table_id);
            return {
              guest_name: guest.full_name,
              table_name: table?.name ?? '',
              seat_number: guest.seat_number ?? null,
            };
          });

        return { data, error: null };
      }

      return { data: null, error: null };
    },
  };
}
