import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorStatus } from './useActorStatus';
import { usePasswordAuth } from '../auth/passwordAuth';
import type { UserProfile, Expense, LoginResult } from '../backend';
import type { Product, Customer, Bill } from '../types/local';

// ============================================================================
// Authentication Queries
// ============================================================================

export function useLoginAsOwner() {
  const { actor, status } = useActorStatus();

  return useMutation({
    mutationFn: async (password: string): Promise<LoginResult> => {
      if (!actor) {
        if (status === 'initializing') {
          throw new Error('Still connecting to server. Please wait a moment and try again.');
        } else if (status === 'error') {
          throw new Error('Unable to connect to server. Please use the "Retry Connection" button to fix the connection issue first.');
        }
        throw new Error('Unable to connect to server. Please wait and try again.');
      }
      // Call the real backend login method with username placeholder and password
      const result = await actor.loginAsOwner('owner', password);
      return result;
    },
  });
}

export function useLoginAsSalesman() {
  const { actor, status } = useActorStatus();

  return useMutation({
    mutationFn: async (password: string): Promise<LoginResult> => {
      if (!actor) {
        if (status === 'initializing') {
          throw new Error('Still connecting to server. Please wait a moment and try again.');
        } else if (status === 'error') {
          throw new Error('Unable to connect to server. Please use the "Retry Connection" button to fix the connection issue first.');
        }
        throw new Error('Unable to connect to server. Please wait and try again.');
      }
      // Call the real backend login method with username placeholder and password
      const result = await actor.loginAsSalesman('salesman', password);
      return result;
    },
  });
}

export function useGetCallerRole() {
  const { actor, status } = useActorStatus();
  const { isAuthenticated } = usePasswordAuth();

  return useQuery({
    queryKey: ['callerRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && status === 'ready' && isAuthenticated,
    retry: false,
  });
}

// ============================================================================
// User Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, status } = useActorStatus();
  const { isAuthenticated } = usePasswordAuth();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    // Enable query as soon as actor exists and user is authenticated
    enabled: !!actor && isAuthenticated,
    retry: false,
    // Ensure fresh data after login
    staleTime: 0,
  });

  // Return custom state that properly reflects actor dependency
  return {
    ...query,
    isLoading: (status === 'initializing') || query.isLoading,
    isFetched: !!actor && isAuthenticated && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActorStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ============================================================================
// Local Storage Operations (Products, Customers, Bills)
// ============================================================================

// Products
export function useGetAllProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => {
      const stored = localStorage.getItem('products');
      return stored ? JSON.parse(stored) : [];
    },
  });
}

// Alias for backwards compatibility
export const useGetProducts = useGetAllProducts;

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      products.push(product);
      localStorage.setItem('products', JSON.stringify(products));
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const index = products.findIndex((p) => p.id === product.id);
      if (index !== -1) {
        products[index] = product;
        localStorage.setItem('products', JSON.stringify(products));
      }
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
      const filtered = products.filter((p) => p.id !== productId);
      localStorage.setItem('products', JSON.stringify(filtered));
      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Customers
export function useGetAllCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => {
      const stored = localStorage.getItem('customers');
      return stored ? JSON.parse(stored) : [];
    },
  });
}

// Alias for backwards compatibility
export const useGetCustomers = useGetAllCustomers;

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Customer) => {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      customers.push(customer);
      localStorage.setItem('customers', JSON.stringify(customers));
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Customer) => {
      const customers: Customer[] = JSON.parse(localStorage.getItem('customers') || '[]');
      const index = customers.findIndex((c) => c.id === customer.id);
      if (index !== -1) {
        customers[index] = customer;
        localStorage.setItem('customers', JSON.stringify(customers));
      }
      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: bigint) => {
      const customers: Customer[] = JSON.parse(localStorage.getItem('customers') || '[]');
      const filtered = customers.filter((c) => c.id !== customerId);
      localStorage.setItem('customers', JSON.stringify(filtered));
      return customerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Bills
export function useGetAllBills() {
  return useQuery<Bill[]>({
    queryKey: ['bills'],
    queryFn: () => {
      const stored = localStorage.getItem('bills');
      return stored ? JSON.parse(stored) : [];
    },
  });
}

// Alias for backwards compatibility
export const useGetBills = useGetAllBills;

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bill: Bill) => {
      const bills = JSON.parse(localStorage.getItem('bills') || '[]');
      bills.push(bill);
      localStorage.setItem('bills', JSON.stringify(bills));
      return bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

// ============================================================================
// Backend Operations (Expenses)
// ============================================================================

export function useGetAllExpenses() {
  const { actor, status } = useActorStatus();
  const { isAuthenticated } = usePasswordAuth();

  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!actor) return [];
      const expenses = await actor.getAllExpenses();
      return expenses;
    },
    enabled: !!actor && status === 'ready' && isAuthenticated,
  });
}

// Alias for backwards compatibility
export const useGetExpenses = useGetAllExpenses;

export function useCreateExpense() {
  const { actor } = useActorStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Expense) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createExpense(expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActorStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteExpense(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useSyncExpenses() {
  const { actor } = useActorStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenses: Expense[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.syncExpenses(expenses);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
