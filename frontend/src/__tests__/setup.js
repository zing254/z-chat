import {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
  indexedDB,
} from 'fake-indexeddb';

Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDB,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBRequest', {
  value: IDBRequest,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBTransaction', {
  value: IDBTransaction,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: IDBKeyRange,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBOpenDBRequest', {
  value: IDBOpenDBRequest,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBCursor', {
  value: IDBCursor,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBCursorWithValue', {
  value: IDBCursorWithValue,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBDatabase', {
  value: IDBDatabase,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBIndex', {
  value: IDBIndex,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBObjectStore', {
  value: IDBObjectStore,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'IDBVersionChangeEvent', {
  value: IDBVersionChangeEvent,
  writable: true,
  configurable: true,
});
