import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type BillId = bigint;
export type CustomerId = bigint;
export type ExpenseId = bigint;
export interface Bill {
    id: BillId;
    gstApplied: boolean;
    creditAmount: bigint;
    gstAmount: bigint;
    timestamp: bigint;
    discount: bigint;
    customerId: CustomerId;
    gstRate: bigint;
    products: Array<Product>;
}
export type ProductId = bigint;
export type LoginResult = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "errorMessage";
    errorMessage: string;
};
export interface Expense {
    id: ExpenseId;
    description: string;
    timestamp: bigint;
    category: string;
    amount: bigint;
}
export interface Customer {
    id: CustomerId;
    name: string;
    address: string;
    phoneNumber: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface Product {
    id: ProductId;
    cost: bigint;
    name: string;
    price: bigint;
    availableInventory: bigint;
    piecesPerCase: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeOwnerPassword(currentPassword: string, newPassword: string): Promise<LoginResult>;
    createBill(bill: Bill): Promise<void>;
    createCustomer(customer: Customer): Promise<void>;
    createExpense(expense: Expense): Promise<void>;
    createExpenses(expenses: Array<Expense>): Promise<void>;
    createProduct(product: Product): Promise<void>;
    deleteBill(bid: BillId): Promise<void>;
    deleteCustomer(cid: CustomerId): Promise<void>;
    deleteExpense(eid: ExpenseId): Promise<void>;
    deleteProduct(pid: ProductId): Promise<void>;
    getAllBills(): Promise<Array<Bill>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllProducts(): Promise<Array<Product>>;
    getBill(bid: BillId): Promise<Bill>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(cid: CustomerId): Promise<Customer>;
    getOwnerStatus(): Promise<boolean>;
    getProduct(_pid: ProductId): Promise<Product>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerLoggedIn(): Promise<boolean>;
    loginAsOwner(passwordAttempt: string): Promise<LoginResult>;
    loginAsSalesman(password: string): Promise<LoginResult>;
    logout(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    syncExpenses(expenses: Array<Expense>): Promise<void>;
    updateCustomer(customer: Customer): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}
