import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface UserProfile {
    name: string;
    role: string;
}
export type ExpenseId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createExpense(expense: Expense): Promise<void>;
    createExpenses(expenses: Array<Expense>): Promise<void>;
    deleteExpense(eid: ExpenseId): Promise<void>;
    getAllExpenses(): Promise<Array<Expense>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    loginAsOwner(_username: string, password: string): Promise<LoginResult>;
    loginAsSalesman(_username: string, password: string): Promise<LoginResult>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    syncExpenses(expenses: Array<Expense>): Promise<void>;
}
