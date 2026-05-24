const MAX_CACHE_ENTRIES = 100;

const CACHE_TTL_MS = {
  count: 15_000,
  cluster: 60_000,
  raw: 20_000,
};

function getModeFromKey(key) {
  return String(key).split(":")[0];
}

function getExpiresAt(key) {
  const mode = getModeFromKey(key);
  const ttl = CACHE_TTL_MS[mode] ?? 0;

  return Date.now() + ttl;
}

export function createViewportCache() {
  const entries = new Map();

  function deleteIfExpired(key) {
    const entry = entries.get(key);

    if (!entry) {
      return true;
    }

    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return true;
    }

    return false;
  }

  function evictOldestEntries() {
    while (entries.size > MAX_CACHE_ENTRIES) {
      const oldestKey = entries.keys().next().value;
      entries.delete(oldestKey);
    }
  }

  function get(key) {
    if (deleteIfExpired(key)) {
      return undefined;
    }

    return entries.get(key).value;
  }

  function set(key, value) {
    if (entries.has(key)) {
      entries.delete(key);
    }

    entries.set(key, {
      value,
      expiresAt: getExpiresAt(key),
    });

    evictOldestEntries();
  }

  function has(key) {
    if (deleteIfExpired(key)) {
      return false;
    }

    return entries.has(key);
  }

  function clear() {
    entries.clear();
  }

  return {
    get,
    set,
    has,
    clear,
  };
}
