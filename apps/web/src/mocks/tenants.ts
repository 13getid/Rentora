// MOCK DATA. Replaced by GET /api/v1/tenants later.
import type { InvoiceStatus } from "@rentora/shared";

export interface Tenant {
  id: string;
  name: string;
  unit: string;
  rent: number;
  balance: number;
  status: InvoiceStatus;
}

export const tenants: Tenant[] = [
  { id: "t1", name: "John Doe", unit: "A102", rent: 20000, balance: 0, status: "PAID" },
  { id: "t2", name: "Jane Smith", unit: "B204", rent: 25000, balance: 25000, status: "OVERDUE" },
  { id: "t3", name: "Ali Hassan", unit: "C103", rent: 18000, balance: 0, status: "PAID" },
  { id: "t4", name: "Amina Yusuf", unit: "A205", rent: 22000, balance: 11000, status: "PARTIAL" },
  { id: "t5", name: "Peter Mwangi", unit: "B101", rent: 24000, balance: 0, status: "PAID" },
  { id: "t6", name: "Grace Achieng", unit: "C202", rent: 18000, balance: 18000, status: "OVERDUE" },
  { id: "t7", name: "Brian Otieno", unit: "A301", rent: 27000, balance: 27000, status: "PENDING" },
  { id: "t8", name: "Fatuma Said", unit: "B305", rent: 21000, balance: 0, status: "PAID" },
  { id: "t9", name: "Kevin Kamau", unit: "C104", rent: 19000, balance: 0, status: "PAID" },
  { id: "t10", name: "Mercy Wanjiru", unit: "A108", rent: 23000, balance: 23000, status: "OVERDUE" },
  { id: "t11", name: "Hassan Omar", unit: "B208", rent: 25000, balance: 12500, status: "PARTIAL" },
  { id: "t12", name: "Linet Chebet", unit: "C301", rent: 20000, balance: 0, status: "PAID" },
];
