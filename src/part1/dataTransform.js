// src/part1/dataTransform.js
/**
 * Part 1: Data transformation utility.
 * - Group by nested key path(s)
 * - Aggregate numeric fields
 * - Sort by an aggregated field
 *
 * Core grouping is O(n) via Map.
 */

function getByPath(obj, path) {
  if (!path) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function normalizeGroupBy(groupBy) {
  if (typeof groupBy === 'string' && groupBy.trim()) return [groupBy.trim()];
  if (Array.isArray(groupBy) && groupBy.length && groupBy.every(k => typeof k === 'string' && k.trim())) {
    return groupBy.map(k => k.trim());
  }
  throw new TypeError("options.groupBy must be a non-empty string or array of non-empty strings");
}

function normalizeAgg(aggregations) {
  const allowed = new Set(['sum', 'avg', 'min', 'max', 'count']);
  if (!isPlainObject(aggregations)) throw new TypeError("options.aggregations must be an object");
  const entries = Object.entries(aggregations);
  if (entries.length === 0) throw new TypeError("options.aggregations must have at least one field");
  for (const [field, op] of entries) {
    if (typeof field !== 'string' || !field.trim()) throw new TypeError("aggregation field must be a non-empty string");
    if (!allowed.has(op)) throw new TypeError(`Invalid aggregation "${op}" for field "${field}". Allowed: sum|avg|min|max|count`);
  }
  return entries.map(([field, op]) => [field.trim(), op]);
}

function normalizeSort(sortBy) {
  if (sortBy == null) return null;
  if (!isPlainObject(sortBy)) throw new TypeError("options.sortBy must be an object");
  const { field, order } = sortBy;
  if (typeof field !== 'string' || !field.trim()) throw new TypeError("options.sortBy.field must be a non-empty string");
  if (order !== 'asc' && order !== 'desc') throw new TypeError("options.sortBy.order must be 'asc' or 'desc'");
  return { field: field.trim(), order };
}

function toKeyString(keyValues) {
  // Stable composite key (treat undefined explicitly)
  return JSON.stringify(keyValues.map(v => (v === undefined ? '__undefined__' : v)));
}

function readKeyValue(item, keyPath) {
  const v = getByPath(item, keyPath);
  return v === undefined ? '__undefined__' : v;
}

/**
 * @param {Array<object>} arr
 * @param {{
 *  groupBy: string | string[],
 *  aggregations: { [field: string]: 'sum' | 'avg' | 'min' | 'max' | 'count' },
 *  sortBy?: { field: string, order: 'asc' | 'desc' },
 *  filterFn?: (item: any) => boolean
 * }} options
 */
function transformData(arr, options) {
  if (!Array.isArray(arr)) throw new TypeError("transformData: first argument must be an array");
  if (!isPlainObject(options)) throw new TypeError("transformData: options must be an object");

  const groupKeys = normalizeGroupBy(options.groupBy);
  const aggEntries = normalizeAgg(options.aggregations);
  const sortBy = normalizeSort(options.sortBy);
  const filterFn = options.filterFn;

  if (filterFn != null && typeof filterFn !== 'function') {
    throw new TypeError("options.filterFn must be a function if provided");
  }

  const map = new Map();

  for (const item of arr) {
    if (filterFn && !filterFn(item)) continue;

    const keyValues = groupKeys.map(k => readKeyValue(item, k));
    const keyString = toKeyString(keyValues);

    let group = map.get(keyString);
    if (!group) {
      const aggState = Object.fromEntries(
        aggEntries.map(([field, op]) => {
          if (op === 'avg') return [field, { sum: 0, count: 0 }];
          if (op === 'min') return [field, { value: Infinity, has: false }];
          if (op === 'max') return [field, { value: -Infinity, has: false }];
          if (op === 'sum') return [field, { sum: 0, has: false }];
          if (op === 'count') return [field, { count: 0 }];
          return [field, null];
        })
      );

      group = { keyValues, items: [], count: 0, aggState };
      map.set(keyString, group);
    }

    group.items.push(item);
    group.count += 1;

    for (const [field, op] of aggEntries) {
      if (op === 'count') {
        group.aggState[field].count += 1;
        continue;
      }
      const raw = getByPath(item, field);
      const num = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
      if (num == null) continue;

      if (op === 'sum') {
        group.aggState[field].sum += num;
        group.aggState[field].has = true;
      } else if (op === 'avg') {
        group.aggState[field].sum += num;
        group.aggState[field].count += 1;
      } else if (op === 'min') {
        group.aggState[field].value = Math.min(group.aggState[field].value, num);
        group.aggState[field].has = true;
      } else if (op === 'max') {
        group.aggState[field].value = Math.max(group.aggState[field].value, num);
        group.aggState[field].has = true;
      }
    }
  }

  const groups = Array.from(map.values()).map(g => {
    const groupObject = Object.fromEntries(
      groupKeys.map((k, i) => [k.split('.').slice(-1)[0], g.keyValues[i] === '__undefined__' ? undefined : g.keyValues[i]])
    );

    const aggregates = Object.fromEntries(
      aggEntries.map(([field, op]) => {
        const st = g.aggState[field];
        if (op === 'sum') return [field, st.has ? st.sum : null];
        if (op === 'avg') return [field, st.count > 0 ? st.sum / st.count : null];
        if (op === 'min') return [field, st.has ? st.value : null];
        if (op === 'max') return [field, st.has ? st.value : null];
        if (op === 'count') return [field, st.count];
        return [field, null];
      })
    );

    return { ...groupObject, aggregates, items: g.items.slice(), count: g.count };
  });

  if (!sortBy) return groups;

  const dir = sortBy.order === 'asc' ? 1 : -1;
  const field = sortBy.field;

  return groups.slice().sort((a, b) => {
    const av = a.aggregates?.[field];
    const bv = b.aggregates?.[field];
    const aNum = typeof av === 'number' ? av : -Infinity;
    const bNum = typeof bv === 'number' ? bv : -Infinity;
    if (aNum < bNum) return -1 * dir;
    if (aNum > bNum) return 1 * dir;
    return 0;
  });
}

module.exports = { transformData, getByPath };
