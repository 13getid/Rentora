// MOCK DATA for the landing-page preview. Replaced by real API data later.
export interface RecentPayment {
  id: string;
  unit: string;
  payer: string;
  amount: number;
  state: "RECONCILED" | "REVIEW";
}

export const recentPayments: RecentPayment[] = [
  { id: "p1", unit: "B204", payer: "Jane Smith", amount: 25000, state: "RECONCILED" },
  { id: "p2", unit: "A102", payer: "John Doe", amount: 20000, state: "RECONCILED" },
  { id: "p3", unit: "?", payer: "Unknown sender", amount: 18000, state: "REVIEW" },
];
