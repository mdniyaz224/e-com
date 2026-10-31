import fs from 'fs';
import path from 'path';
import { getDatabase } from './mongodb';

const dataDir = path.resolve(process.cwd(), 'src/data');

// Safe file reader
function loadJson(filename, defaultValue) {
  try {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.warn(`[dataStore] Could not read ${filename}:`, err.message);
  }
  return defaultValue;
}

// Safe file writer
function saveJson(filename, data) {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn(`[dataStore] Could not write ${filename} (may be read-only):`, err.message);
    return false;
  }
}

// Global in-memory cache
if (!globalThis.__pulsekartDataStore) {
  globalThis.__pulsekartDataStore = {
    products: null,
    orders: null,
    cart: null,
    user: null,
    notifications: null,
    categories: null,
    banners: null,
    otpStore: new Map(),
    activeSessions: new Map(),
    seeded: new Set(),
  };
}

const globalStore = globalThis.__pulsekartDataStore;
if (!globalStore.seeded) {
  globalStore.seeded = new Set();
}
if (!globalStore.otpStore) {
  globalStore.otpStore = new Map();
}
if (!globalStore.activeSessions) {
  globalStore.activeSessions = new Map();
}

// Clean MongoDB _id to match standard schema
function cleanMongoDoc(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(cleanMongoDoc);
  const { _id, ...rest } = doc;
  return rest;
}

// 1. PRODUCTS
export async function getProducts() {
  const db = await getDatabase();
  if (db) {
    const col = db.collection('products');
    const count = await col.countDocuments();
    if (count === 0 && !globalStore.seeded?.has('products')) {
      // Auto-seed initial products from src/data/products.json
      const initial = loadJson('products.json', []);
      if (initial.length > 0) {
        await col.insertMany(initial.map((p) => ({ ...p })));
        globalStore.seeded?.add('products');
        console.log(`[MongoDB Atlas] Auto-seeded ${initial.length} products into collection 'products'.`);
      }
    }
    const docs = await col.find({}).sort({ id: 1 }).toArray();
    return cleanMongoDoc(docs);
  }

  // Fallback to local JSON / memory
  if (!globalStore.products) {
    globalStore.products = loadJson('products.json', []);
  }
  return globalStore.products;
}

export async function saveProducts(products) {
  globalStore.products = products;
  saveJson('products.json', products);

  const db = await getDatabase();
  if (db) {
    const col = db.collection('products');
    // Upsert products into MongoDB
    for (const p of products) {
      await col.updateOne({ id: p.id }, { $set: p }, { upsert: true });
    }
  }
}

// 2. ORDERS
export async function getOrders() {
  const db = await getDatabase();
  if (db) {
    const col = db.collection('orders');
    const count = await col.countDocuments();
    if (count === 0 && !globalStore.seeded?.has('orders')) {
      const initial = loadJson('orders.json', []);
      if (initial.length > 0) {
        await col.insertMany(initial.map((o) => ({ ...o })));
        globalStore.seeded?.add('orders');
        console.log(`[MongoDB Atlas] Auto-seeded ${initial.length} orders into collection 'orders'.`);
      }
    }
    const docs = await col.find({}).sort({ date: -1 }).toArray();
    return cleanMongoDoc(docs);
  }

  if (!globalStore.orders) {
    globalStore.orders = loadJson('orders.json', []);
  }
  return globalStore.orders;
}

export async function saveOrders(orders) {
  globalStore.orders = orders;
  saveJson('orders.json', orders);

  const db = await getDatabase();
  if (db) {
    const col = db.collection('orders');
    for (const o of orders) {
      await col.updateOne({ id: o.id }, { $set: o }, { upsert: true });
    }
  }
}

// 3. USER
export async function getUser() {
  const db = await getDatabase();
  if (db) {
    const col = db.collection('users');
    let doc = await col.findOne({ id: 1 });
    if (!doc) {
      const initial = loadJson('user.json', {
        id: 1,
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@pulsekart.in',
        avatar: '/images/profile-avatar.png',
        isPlusMember: true,
        gender: 'Male',
        password: 'pulsekart123',
        addresses: [],
        superCoins: { balance: 450, value: 450 },
      });
      await col.insertOne({ ...initial });
      doc = initial;
      console.log("[MongoDB Atlas] Auto-seeded default user into collection 'users'.");
    }
    return cleanMongoDoc(doc);
  }

  if (!globalStore.user) {
    globalStore.user = loadJson('user.json', {
      id: 1,
      name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      email: 'rahul.sharma@pulsekart.in',
      avatar: '/images/profile-avatar.png',
      isPlusMember: true,
      gender: 'Male',
      password: 'pulsekart123',
      addresses: [],
      superCoins: { balance: 450, value: 450 },
    });
  }
  return globalStore.user;
}

export async function saveUser(user) {
  globalStore.user = user;
  saveJson('user.json', user);

  const db = await getDatabase();
  if (db) {
    const col = db.collection('users');
    await col.updateOne({ id: user.id || 1 }, { $set: user }, { upsert: true });
  }
}

// 4. CATEGORIES & BANNERS
export async function getCategories() {
  const db = await getDatabase();
  if (db) {
    const col = db.collection('categories');
    const count = await col.countDocuments();
    if (count === 0 && !globalStore.seeded?.has('categories')) {
      const initial = loadJson('categories.json', []);
      if (initial.length > 0) {
        await col.insertMany(initial.map((c) => ({ ...c })));
        globalStore.seeded?.add('categories');
      }
    }
    const docs = await col.find({}).toArray();
    return cleanMongoDoc(docs);
  }

  if (!globalStore.categories) {
    globalStore.categories = loadJson('categories.json', []);
  }
  return globalStore.categories;
}

export async function getBanners() {
  const db = await getDatabase();
  if (db) {
    const col = db.collection('banners');
    const count = await col.countDocuments();
    if (count === 0 && !globalStore.seeded?.has('banners')) {
      const initial = loadJson('banners.json', []);
      if (initial.length > 0) {
        await col.insertMany(initial.map((b) => ({ ...b })));
        globalStore.seeded?.add('banners');
      }
    }
    const docs = await col.find({}).toArray();
    return cleanMongoDoc(docs);
  }

  if (!globalStore.banners) {
    globalStore.banners = loadJson('banners.json', []);
  }
  return globalStore.banners;
}

// Helper to deduplicate notifications by id
function deduplicateNotifications(notifs) {
  if (!Array.isArray(notifs)) return [];
  const seen = new Set();
  const result = [];
  for (const n of notifs) {
    if (n && n.id) {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        result.push(n);
      }
    } else if (n) {
      result.push(n);
    }
  }
  return result;
}

// 5. NOTIFICATIONS
export async function getNotifications() {
  const db = await getDatabase();
  if (db) {
    const col = db.collection('notifications');
    const count = await col.countDocuments();
    if (count === 0 && !globalStore.seeded?.has('notifications')) {
      const initial = loadJson('notifications.json', []);
      if (initial.length > 0) {
        await col.insertMany(initial.map((n) => ({ ...n })));
        globalStore.seeded?.add('notifications');
      }
    }
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return deduplicateNotifications(cleanMongoDoc(docs));
  }

  if (!globalStore.notifications) {
    globalStore.notifications = loadJson('notifications.json', []);
  }
  return deduplicateNotifications(globalStore.notifications);
}

export async function saveNotifications(notifs) {
  const deduplicated = deduplicateNotifications(notifs);
  globalStore.notifications = deduplicated;
  saveJson('notifications.json', deduplicated);

  const db = await getDatabase();
  if (db) {
    const col = db.collection('notifications');
    for (const n of deduplicated) {
      await col.updateOne({ id: n.id }, { $set: n }, { upsert: true });
    }
  }
}

export async function pushNotification(notif) {
  const notifs = await getNotifications();
  const newNotif = {
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    title: notif.title || 'PulseKart Alert',
    desc: notif.desc || '',
    category: notif.category || 'orders',
    orderId: notif.orderId || null,
    link: notif.link || '/notifications',
    image: notif.image || null,
    icon: notif.icon || '🔔',
    badgeColor: notif.badgeColor || '#2874f0',
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifs.unshift(newNotif);
  await saveNotifications(notifs);

  return newNotif;
}

// 6. CART (Session based / in-memory or persisted)
export async function getCart() {
  if (!globalStore.cart) {
    globalStore.cart = [
      {
        id: 1,
        productId: 1,
        name: 'NovaSound Pro ANC Wireless Headphones (Matte Obsidian)',
        image: '/images/headphones.png',
        price: 2499,
        originalPrice: 6999,
        discount: 64,
        seller: 'RetailNet',
        color: 'Matte Obsidian',
        quantity: 1,
        isAssured: true,
        deliveryBy: 'Tomorrow, 2 PM',
        deliveryFree: true,
      },
      {
        id: 2,
        productId: 7,
        name: 'Braided Fast Charging Type-C Cable 65W (1.5m)',
        image: '/images/usb-cable.png',
        price: 349,
        originalPrice: 999,
        discount: 65,
        seller: 'TechElectro',
        color: 'Black',
        quantity: 1,
        isAssured: true,
        deliveryBy: 'Thursday',
        deliveryFree: true,
      },
    ];
  }
  return globalStore.cart;
}

export async function saveCart(cart) {
  globalStore.cart = cart;
}

// 7. AUTH OTP & SESSIONS STORE
export const otpStore = globalStore.otpStore;
export const activeSessions = globalStore.activeSessions;
