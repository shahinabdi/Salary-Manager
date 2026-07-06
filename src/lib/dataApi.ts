import type { YearlyData } from '../types';

interface DataApiError {
  error?: string;
}

interface GetEntriesResponse {
  entries: YearlyData[];
}

interface SingleEntryResponse {
  entry: YearlyData;
}

interface BulkImportResponse {
  importedCount: number;
  skippedCount: number;
  importedIds: string[];
  skippedIds: string[];
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as DataApiError;

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

function normalizeDates(entries: YearlyData[]): YearlyData[] {
  return entries.map((entry) => ({
    ...entry,
    createdAt: new Date(entry.createdAt),
    updatedAt: new Date(entry.updatedAt),
  }));
}

export async function fetchEntries(): Promise<YearlyData[]> {
  const response = await fetch('/api/data', {
    method: 'GET',
    credentials: 'include',
  });

  const payload = await parseJson<GetEntriesResponse>(response);
  return normalizeDates(payload.entries);
}

export async function createEntry(entry: YearlyData): Promise<YearlyData> {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ entry }),
  });

  const payload = await parseJson<SingleEntryResponse>(response);
  return normalizeDates([payload.entry])[0];
}

export async function updateEntry(id: string, updates: Partial<YearlyData>): Promise<YearlyData> {
  const response = await fetch('/api/data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id, updates }),
  });

  const payload = await parseJson<SingleEntryResponse>(response);
  return normalizeDates([payload.entry])[0];
}

export async function deleteEntry(id: string, category?: string): Promise<void> {
  const response = await fetch('/api/data', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id, ...(category ? { category } : {}) }),
  });

  await parseJson<{ success: boolean }>(response);
}

export async function clearEntries(): Promise<void> {
  const response = await fetch('/api/data', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ all: true }),
  });

  await parseJson<{ success: boolean }>(response);
}

export async function bulkImportEntries(entries: YearlyData[]): Promise<BulkImportResponse> {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ entries }),
  });

  return parseJson<BulkImportResponse>(response);
}
