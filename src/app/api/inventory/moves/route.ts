// app/api/inventory/moves/route.ts — history for one ingredient, + cleanup
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireStaffSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  const s = await requireStaffSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("ingredientId");
  const db = await getDb();
  const moves = await db
    .collection("stock_moves")
    .find(id ? { ingredientId: id } : {})
    .sort({ at: -1 })
    .limit(200)
    .toArray();
  return NextResponse.json(
    moves.map((m: any) => ({ ...m, _id: String(m._id) })),
  );
}

// DELETE supports two modes:
//   ?id=<moveId>                                  → delete one entry
//   ?ingredientId=<id>&olderThanDays=<n>           → bulk-delete old entries
//                                                     for one ingredient
//   ?olderThanDays=<n>  (ingredientId omitted)     → bulk-delete old entries
//                                                     across ALL ingredients
// Both modes are admin-only — staff can log moves but not erase them.
export async function DELETE(req: Request) {
  const s = await requireStaffSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (s.role !== "admin")
    return NextResponse.json({ error: "admin only" }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const ingredientId = url.searchParams.get("ingredientId");
  const olderThanDaysRaw = url.searchParams.get("olderThanDays");
  const db = await getDb();

  if (id) {
    const r = await db
      .collection("stock_moves")
      .deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ ok: true, deleted: r.deletedCount });
  }

  if (olderThanDaysRaw) {
    const days = Number(olderThanDaysRaw);
    if (!days || days <= 0)
      return NextResponse.json({ error: "bad olderThanDays" }, { status: 400 });
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter: any = { at: { $lt: cutoff } };
    if (ingredientId) filter.ingredientId = ingredientId;
    const r = await db.collection("stock_moves").deleteMany(filter);
    return NextResponse.json({ ok: true, deleted: r.deletedCount });
  }

  return NextResponse.json(
    { error: "pass id, or olderThanDays (optionally with ingredientId)" },
    { status: 400 },
  );
}

/*
 * OPTIONAL: auto-expire via a MongoDB TTL index, so old entries vanish on
 * their own with no button-clicking. Run this ONCE (mongosh, a migration
 * script, or a one-off route you delete after running):
 *
 *   db.stock_moves.createIndex(
 *     { at: 1 },
 *     { expireAfterSeconds: 60 * 60 * 24 * 180 } // 180 days
 *   )
 *
 * Caveat: TTL indexes only fire on a real BSON Date field, not a string.
 * Check how `applyMoves` in @/lib/inventory writes `at` — if it's
 * `new Date()` you're fine; if it's `new Date().toISOString()` (a string),
 * the TTL index will silently do nothing and you'd need to either fix that
 * write or lean on the manual/per-entry delete above instead. Happy to
 * check that file if you paste it.
 */
