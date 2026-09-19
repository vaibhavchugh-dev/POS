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
    { id: "mi-1", name: "Plain Dosa (Jain)", categoryId: "cat-dosa", price: 80, available: true },
    { id: "mi-2", name: "Masala Dosa (Jain)", categoryId: "cat-dosa", price: 120, available: true },
    { id: "mi-3", name: "Mysore Masala Dosa (Jain)", categoryId: "cat-dosa", price: 140, available: true },
    { id: "mi-4", name: "Set Dosa (2 pcs, Jain)", categoryId: "cat-dosa", price: 110, available: true },
    { id: "mi-5", name: "Rava Dosa (Jain)", categoryId: "cat-dosa", price: 130, available: true },
    { id: "mi-6", name: "Paper Dosa", categoryId: "cat-dosa", price: 150, available: true },
    { id: "mi-7", name: "Idli (2 pcs)", categoryId: "cat-idli", price: 50, available: true },
    { id: "mi-8", name: "Rava Idli (2 pcs)", categoryId: "cat-idli", price: 70, available: true },
    { id: "mi-9", name: "Medu Vada (2 pcs)", categoryId: "cat-idli", price: 60, available: true },
    { id: "mi-10", name: "Idli Vada Combo", categoryId: "cat-idli", price: 90, available: true },
    { id: "mi-11", name: "Sambar Rice (Jain)", categoryId: "cat-rice", price: 110, available: true },
    { id: "mi-12", name: "Curd Rice (Jain)", categoryId: "cat-rice", price: 90, available: true },
    { id: "mi-13", name: "Filter Coffee", categoryId: "cat-drinks", price: 40, available: true },
    { id: "mi-14", name: "Masala Chaas", categoryId: "cat-drinks", price: 40, available: true },
    { id: "mi-15", name: "Fresh Lime Soda", categoryId: "cat-drinks", price: 50, available: true },
    { id: "mi-16", name: "Coconut Chutney", categoryId: "cat-sides", price: 20, available: true },
    { id: "mi-17", name: "Sambar Cup", categoryId: "cat-sides", price: 30, available: true },
  ];

  return {
    categories,
    menuItems,
    bills: [],
    nextBillNumber: 1,
    taxRate: 0.05,
  };
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatBillNumber(n: number) {
  return `BILL-${String(n).padStart(4, "0")}`;
}
