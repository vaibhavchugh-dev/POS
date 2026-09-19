import type { PosStore } from "./types";

export function seedStore(): PosStore {
  const categories = [
    { id: "cat-dosa", name: "Dosa", sortOrder: 1 },
    { id: "cat-idli", name: "Idli & Vada", sortOrder: 2 },
    { id: "cat-rice", name: "Rice", sortOrder: 3 },
    { id: "cat-drinks", name: "Drinks", sortOrder: 4 },
    { id: "cat-sides", name: "Sides", sortOrder: 5 },
  ];

  const menuItems = [
    { id: "mi-1", name: "Plain Dosa (Jain)", categoryId: "cat-dosa", price: 6.5, available: true },
    { id: "mi-2", name: "Masala Dosa (Jain)", categoryId: "cat-dosa", price: 8.95, available: true },
    { id: "mi-3", name: "Mysore Masala Dosa (Jain)", categoryId: "cat-dosa", price: 9.5, available: true },
    { id: "mi-4", name: "Set Dosa (2 pcs, Jain)", categoryId: "cat-dosa", price: 7.95, available: true },
    { id: "mi-5", name: "Rava Dosa (Jain)", categoryId: "cat-dosa", price: 9.25, available: true },
    { id: "mi-6", name: "Paper Dosa", categoryId: "cat-dosa", price: 8.5, available: true },
    { id: "mi-7", name: "Idli (2 pcs)", categoryId: "cat-idli", price: 5.5, available: true },
    { id: "mi-8", name: "Rava Idli (2 pcs)", categoryId: "cat-idli", price: 6.25, available: true },
    { id: "mi-9", name: "Medu Vada (2 pcs)", categoryId: "cat-idli", price: 6.5, available: true },
    { id: "mi-10", name: "Idli Vada Combo", categoryId: "cat-idli", price: 7.95, available: true },
    { id: "mi-11", name: "Sambar Rice (Jain)", categoryId: "cat-rice", price: 8.5, available: true },
    { id: "mi-12", name: "Curd Rice (Jain)", categoryId: "cat-rice", price: 7.5, available: true },
    { id: "mi-13", name: "Filter Coffee", categoryId: "cat-drinks", price: 2.95, available: true },
    { id: "mi-14", name: "Masala Chaas", categoryId: "cat-drinks", price: 3.25, available: true },
    { id: "mi-15", name: "Fresh Lime Soda", categoryId: "cat-drinks", price: 3.5, available: true },
    { id: "mi-16", name: "Coconut Chutney", categoryId: "cat-sides", price: 1.5, available: true },
    { id: "mi-17", name: "Sambar Cup", categoryId: "cat-sides", price: 2.25, available: true },
  ];

  return {
    categories,
    menuItems,
    bills: [],
    nextBillNumber: 1,
    taxRate: 0.1,
  };
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatBillNumber(n: number) {
  return `BILL-${String(n).padStart(4, "0")}`;
}
