import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type ProductId = Nat;
  public type CustomerId = Nat;
  public type BillId = Nat;
  public type ExpenseId = Nat;

  public type Product = {
    id : ProductId;
    name : Text;
    price : Nat;
    cost : Nat;
    availableInventory : Nat;
    piecesPerCase : Nat;
  };

  public type Customer = {
    id : CustomerId;
    name : Text;
    address : Text;
    phoneNumber : Text;
  };

  public type Bill = {
    id : BillId;
    customerId : CustomerId;
    products : [Product];
    discount : Nat;
    creditAmount : Nat;
    timestamp : Int;
    gstApplied : Bool;
    gstRate : Nat;
    gstAmount : Nat;
  };

  public type UserProfile = {
    name : Text;
    role : Text;
  };

  public type Expense = {
    id : ExpenseId;
    description : Text;
    amount : Nat;
    category : Text;
    timestamp : Int;
  };

  let productMap = Map.empty<ProductId, Product>();
  let customerMap = Map.empty<CustomerId, Customer>();
  let billMap = Map.empty<BillId, Bill>();
  let expenseMap = Map.empty<ExpenseId, Expense>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireUser(caller);
    userProfiles.add(caller, profile);
  };

  // Product Management
  public shared ({ caller }) func createProduct(product : Product) : async () {
    requireUser(caller);
    if (productMap.containsKey(product.id)) {
      Runtime.trap("Product ID already exists");
    };
    productMap.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    requireUser(caller);
    if (not productMap.containsKey(product.id)) {
      Runtime.trap("Product not found");
    };
    productMap.add(product.id, product);
  };

  public query ({ caller }) func getProduct(_pid : ProductId) : async Product {
    requireUser(caller);
    switch (productMap.get(_pid)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    requireUser(caller);
    productMap.values().toArray();
  };

  public shared ({ caller }) func deleteProduct(pid : ProductId) : async () {
    requireUser(caller);
    if (not productMap.containsKey(pid)) {
      Runtime.trap("Product not found");
    };
    productMap.remove(pid);
  };

  // Customer Management
  public shared ({ caller }) func createCustomer(customer : Customer) : async () {
    requireUser(caller);
    if (customerMap.containsKey(customer.id)) {
      Runtime.trap("Customer ID already exists");
    };
    customerMap.add(customer.id, customer);
  };

  public shared ({ caller }) func updateCustomer(customer : Customer) : async () {
    requireUser(caller);
    if (not customerMap.containsKey(customer.id)) {
      Runtime.trap("Customer not found");
    };
    customerMap.add(customer.id, customer);
  };

  public query ({ caller }) func getCustomer(cid : CustomerId) : async Customer {
    requireUser(caller);
    switch (customerMap.get(cid)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    requireUser(caller);
    customerMap.values().toArray();
  };

  public shared ({ caller }) func deleteCustomer(cid : CustomerId) : async () {
    requireUser(caller);
    if (not customerMap.containsKey(cid)) {
      Runtime.trap("Customer not found");
    };
    customerMap.remove(cid);
  };

  // Bill Management
  public shared ({ caller }) func createBill(bill : Bill) : async () {
    requireUser(caller);
    if (billMap.containsKey(bill.id)) {
      Runtime.trap("Bill ID already exists");
    };

    for (product in bill.products.values()) {
      switch (productMap.get(product.id)) {
        case (?existingProduct) {
          if (existingProduct.availableInventory < 1) {
            Runtime.trap("Insufficient inventory for product " # product.id.toText());
          };
        };
        case (null) {};
      };
    };

    for (product in bill.products.values()) {
      switch (productMap.get(product.id)) {
        case (?existingProduct) {
          let updatedProduct = {
            existingProduct with availableInventory = existingProduct.availableInventory - 1;
          };
          productMap.add(product.id, updatedProduct);
        };
        case (null) {};
      };
    };

    billMap.add(bill.id, bill);
  };

  public query ({ caller }) func getBill(bid : BillId) : async Bill {
    requireUser(caller);
    switch (billMap.get(bid)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) { bill };
    };
  };

  public query ({ caller }) func getAllBills() : async [Bill] {
    requireUser(caller);
    billMap.values().toArray();
  };

  public shared ({ caller }) func deleteBill(bid : BillId) : async () {
    requireUser(caller);
    if (not billMap.containsKey(bid)) {
      Runtime.trap("Bill not found");
    };
    billMap.remove(bid);
  };

  // Expense Management
  public shared ({ caller }) func createExpense(expense : Expense) : async () {
    requireUser(caller);
    if (expenseMap.containsKey(expense.id)) {
      Runtime.trap("Expense ID already exists");
    };
    expenseMap.add(expense.id, expense);
  };

  public shared ({ caller }) func createExpenses(expenses : [Expense]) : async () {
    requireUser(caller);
    for (expense in expenses.values()) {
      if (expenseMap.containsKey(expense.id)) {
        Runtime.trap("Expense ID already exists");
      };
      expenseMap.add(expense.id, expense);
    };
  };

  public shared ({ caller }) func deleteExpense(eid : ExpenseId) : async () {
    requireUser(caller);
    if (not expenseMap.containsKey(eid)) {
      Runtime.trap("Expense not found");
    };
    expenseMap.remove(eid);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    requireUser(caller);
    expenseMap.values().toArray();
  };

  public shared ({ caller }) func syncExpenses(expenses : [Expense]) : async () {
    requireUser(caller);
    for (expense in expenses.values()) {
      if (expenseMap.containsKey(expense.id)) {
        Runtime.trap("Expense ID already exists during sync");
      };
      expenseMap.add(expense.id, expense);
    };
  };

  func requireUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };
};
