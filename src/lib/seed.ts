import type { PosStore } from "./types";

export function seedStore(): PosStore {
  const categories = [
    { id: "cat-starters", name: "Starters", sortOrder: 1 },
    { id: "cat-mains", name: "Mains", sortOrder: 2 },
    { id: "cat-breads", name: "Breads & Rice", sortOrder: 3 },
    { id: "cat-drinks", name: "Drinks", sortOrder: 4 },
    { id: "cat-desserts", name: "Desserts", sortOrder: 5 },
  ];

  const menuItems = [
    { id: "mi-1", name: "Vegetable Samosa (2 pcs)", categoryId: "cat-starters", price: 4.5, available: true },
    { id: "mi-2", name: "Chicken Tikka", categoryId: "cat-starters", price: 8.95, available: true },
    { id: "mi-3", name: "Paneer Pakora", categoryId: "cat-starters", price: 7.5, available: true },
    { id: "mi-4", name: "Butter Chicken", categoryId: "cat-mains", price: 16.95, available: true },
    { id: "mi-5", name: "Lamb Rogan Josh", categoryId: "cat-mains", price: 18.5, available: true },
    { id: "mi-6", name: "Palak Paneer", categoryId: "cat-mains", price: 14.95, available: true },
    { id: "mi-7", name: "Chana Masala", categoryId: "cat-mains", price: 13.5, available: true },
    { id: "mi-8", name: "Fish Curry", categoryId: "cat-mains", price: 17.95, available: true },
    { id: "mi-9", name: "Garlic Naan", categoryId: "cat-breads", price: 3.75, available: true },
    { id: "mi-10", name: "Butter Naan", categoryId: "cat-breads", price: 3.25, available: true },
    { id: "mi-11", name: "Jeera Rice", categoryId: "cat-breads", price: 4.5, available: true },
    { id: "mi-12", name: "Biryani Rice", categoryId: "cat-breads", price: 6.95, available: true },
    { id: "mi-13", name: "Mango Lassi", categoryId: "cat-drinks", price: 4.25, available: true },
    { id: "mi-14", name: "Masala Chai", categoryId: "cat-drinks", price: 2.95, available: true },
    { id: "mi-15", name: "Sparkling Water", categoryId: "cat-drinks", price: 2.5, available: true },
    { id: "mi-16", name: "Gulab Jamun (2 pcs)", categoryId: "cat-desserts", price: 5.5, available: true },
    { id: "mi-17", name: "Kheer", categoryId: "cat-desserts", price: 5.95, available: true },
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
