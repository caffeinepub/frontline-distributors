// Local type definitions for frontend-only data structures
// These types are not available in the backend interface

export type ProductId = bigint;
export type CustomerId = bigint;
export type BillId = bigint;

export interface Product {
  id: ProductId;
  name: string;
  price: bigint;
  cost: bigint;
  availableInventory: bigint;
  piecesPerCase: bigint;
}

export interface Customer {
  id: CustomerId;
  name: string;
  address: string;
  phoneNumber: string;
}

export interface Bill {
  id: BillId;
  customerId: CustomerId;
  products: Product[];
  discount: bigint;
  creditAmount: bigint;
  timestamp: bigint;
  gstApplied: boolean;
  gstRate: bigint;
  gstAmount: bigint;
}

// Note: LoginResult is now imported from backend.d.ts instead of being defined here
