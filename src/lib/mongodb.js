import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so the client promise
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode (e.g. Vercel), it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // If no MONGODB_URI is provided, clientPromise is null (falls back to local JSON)
  clientPromise = null;
}

export default clientPromise;

/**
 * Helper to get the MongoDB database instance.
 * Returns null if MONGODB_URI is not set or connection fails.
 */
export async function getDatabase(dbName = 'pulsekart') {
  if (!clientPromise) return null;
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (err) {
    console.warn('[MongoDB Atlas] Could not connect to database, falling back to local data:', err.message);
    return null;
  }
}

