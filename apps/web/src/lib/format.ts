// Money is stored as whole KES integers. Format only at the edge, in the UI.
const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
});

export const formatKES = (amount: number) => kes.format(amount).replace(/\u00a0/g, " ");
export const formatNumber = (n: number) => new Intl.NumberFormat("en-KE").format(n);
