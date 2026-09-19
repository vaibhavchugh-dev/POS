export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  available: boolean;
};

export type BillLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Bill = {
  id: string;
  billNumber: number;
  tableLabel: string;
  createdAt: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  lines: BillLine[];
};

export type PosStore = {
  categories: Category[];
  menuItems: MenuItem[];
  bills: Bill[];
  nextBillNumber: number;
  taxRate: number;
};

export type TicketLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};
