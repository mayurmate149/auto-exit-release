import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DBNAME || "5_Paisa_Auto_Exit";
const COLLECTION = "settings";

async function withDb(fn) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(COLLECTION);
    return await fn(collection, db, client);
  } finally {
    await client.close();
  }
}

export async function GET() {
  try {
    const doc = await withDb(async (collection) => {
      return await collection.findOne({});
    });
    return NextResponse.json({ success: true, settings: doc || {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const result = await withDb(async (collection) => {
      return await collection.updateOne(
        {},
        { $set: data },
        { upsert: true }
      );
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
