export type Cell = string | number | null;
export type PracticeTable = { name: string; description: string; columns: { name: string; type: string; note?: string }[]; rows: Cell[][] };

/** Small enough to inspect, deliberately rich in interview edge cases. No real customer data. */
export function createFixture(variation = false): PracticeTable[] {
  const customers: Cell[][] = Array.from({ length: 60 }, (_, i) => [i + 1, `Buyer ${String(i + 1).padStart(2, "0")}`, ["US", "GB", "CA"][i % 3], i % 7 === 0 ? null : `buyer${i + 1}@example.com`, "2025-12-01"]);
  const products: Cell[][] = [[1, "Desk lamp", "Home", 4500], [2, "Headphones", "Electronics", 12000], [3, "Notebook", "Office", 1500], [4, "Keyboard", "Electronics", 8000], [5, "Coffee set", "Home", 6000], [6, "Backpack", "Travel", 9500]];
  const orders: Cell[][] = [], items: Cell[][] = [], payments: Cell[][] = [], refunds: Cell[][] = [];
  function order(id: number, customer: number, timestamp: string, status: string, total: number, product: number, quantity: number) {
    orders.push([id, customer, timestamp, status, total]);
    // One or two line items, whose totals always reconstruct the order amount.
    const first = id % 3 === 0 ? Math.floor(total / 2) : total;
    items.push([items.length + 1, id, product, quantity, first / quantity]);
    if (first < total) items.push([items.length + 1, id, product === 6 ? 1 : product + 1, 1, total - first]);
    if (id % 7 === 0) payments.push([payments.length + 1, id, "failed", total, timestamp.slice(0, 10)]);
    if (status === "completed") {
      const paymentId = payments.length + 1;
      payments.push([paymentId, id, "captured", total, timestamp.slice(0, 10)]);
      if (id % 8 === 0) {
        refunds.push([refunds.length + 1, paymentId, "succeeded", Math.floor(total / 4), "2026-06-25"]);
        if (id % 16 === 0) refunds.push([refunds.length + 1, paymentId, "succeeded", Math.floor(total / 8), "2026-06-26"]);
      }
      if (id % 11 === 0) refunds.push([refunds.length + 1, paymentId, "pending", Math.floor(total / 5), "2026-06-27"]);
    }
  }
  for (let i = 1; i <= 240; i++) {
    const customer = 1 + (i * 17) % 48, month = 1 + (Math.floor((i - 1) / 40) % 6), day = 1 + (i * 7) % 24;
    const product = 1 + i % 6, total = Number(products[product - 1][3]) * (1 + i % 2) + (variation ? (i % 4) * 100 : 0);
    order(i, customer, `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(8 + i % 10).padStart(2, "0")}:00:00`, i % 13 === 0 ? "cancelled" : i % 17 === 0 ? "pending" : "completed", total, product, total % 4 === 0 && i % 2 === 0 ? 2 : 1);
  }
  const extra: [number, number, string, string, number][] = [
    [301, 57, "2026-03-05 10:00:00", "completed", 15000], [302, 57, "2026-04-15 10:00:00", "completed", 25000],
    [303, 58, "2026-03-05 10:00:00", "completed", 5000], [304, 58, "2026-03-05 10:00:00", "completed", 15000],
    [305, 59, "2026-02-28 10:00:00", "completed", 5000], [306, 59, "2026-03-12 10:00:00", "completed", 30000],
    [307, 60, "2026-03-02 10:00:00", "completed", 9999], [308, 60, "2026-03-20 10:00:00", "completed", 20000],
    [309, 60, "2026-06-05 10:00:00", "cancelled", 5000], [310, 56, "2026-01-31 10:00:00", "cancelled", 12000],
    [311, 56, "2026-03-01 10:00:00", "completed", 20000],
  ];
  for (const [id, customer, time, status, amount] of extra) order(id, customer, time, status, amount + (variation ? 2000 : 0), 1, 1);
  return [
    { name: "customers", description: "Buyer accounts. Some buyers have no orders, and some email addresses are NULL.", columns: [{ name: "customer_id", type: "INTEGER PRIMARY KEY" }, { name: "customer_name", type: "VARCHAR" }, { name: "country", type: "VARCHAR" }, { name: "email", type: "VARCHAR" }, { name: "signup_date", type: "DATE" }], rows: customers },
    { name: "products", description: "Catalog categories and list prices. Order items hold the actual historical sale price.", columns: [{ name: "product_id", type: "INTEGER PRIMARY KEY" }, { name: "product_name", type: "VARCHAR" }, { name: "category", type: "VARCHAR" }, { name: "list_price_cents", type: "INTEGER" }], rows: products },
    { name: "orders", description: "One row per order. Only completed orders count as revenue unless a question says otherwise. Times are UTC.", columns: [{ name: "order_id", type: "INTEGER PRIMARY KEY" }, { name: "customer_id", type: "INTEGER", note: "→ customers.customer_id" }, { name: "ordered_at", type: "TIMESTAMP" }, { name: "status", type: "VARCHAR", note: "completed / cancelled / pending" }, { name: "order_total_cents", type: "INTEGER" }], rows: orders },
    { name: "order_items", description: "One or more lines per order. SUM(quantity × unit_price_cents) reconstructs the order total.", columns: [{ name: "item_id", type: "INTEGER PRIMARY KEY" }, { name: "order_id", type: "INTEGER", note: "→ orders.order_id" }, { name: "product_id", type: "INTEGER", note: "→ products.product_id" }, { name: "quantity", type: "INTEGER" }, { name: "unit_price_cents", type: "INTEGER" }], rows: items },
    { name: "payments", description: "Payment attempts. A failed attempt can precede a captured payment on the same order. Count captured money only.", columns: [{ name: "payment_id", type: "INTEGER PRIMARY KEY" }, { name: "order_id", type: "INTEGER", note: "→ orders.order_id" }, { name: "status", type: "VARCHAR", note: "captured / failed" }, { name: "amount_cents", type: "INTEGER" }, { name: "paid_on", type: "DATE" }], rows: payments },
    { name: "refunds", description: "Refund requests. More than one refund may reference one payment. Only succeeded refunds reduce net collections.", columns: [{ name: "refund_id", type: "INTEGER PRIMARY KEY" }, { name: "payment_id", type: "INTEGER", note: "→ payments.payment_id" }, { name: "status", type: "VARCHAR", note: "succeeded / pending" }, { name: "amount_cents", type: "INTEGER" }, { name: "refunded_on", type: "DATE" }], rows: refunds },
  ];
}

export const practiceTables = createFixture();
const literal = (value: Cell) => value === null ? "NULL" : typeof value === "number" ? String(value) : `'${value.replaceAll("'", "''")}'`;
export function fixtureSql(variation = false): string {
  return createFixture(variation).map(table => `CREATE TABLE ${table.name} (${table.columns.map(c => `${c.name} ${c.type}`).join(", ")});\nINSERT INTO ${table.name} VALUES\n${table.rows.map(row => `(${row.map(literal).join(", ")})`).join(",\n")};`).join("\n");
}
