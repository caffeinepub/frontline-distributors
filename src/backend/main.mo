import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

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

  public type LoginResult = {
    #ok : UserProfile;
    #errorMessage : Text;
  };

  // Persist login state
  let loggedInPrincipals = Map.empty<Principal, Bool>();

  type OwnerStatus = {
    var isInitialized : Bool;
    var password : ?Text;
  };

  let productMap = Map.empty<ProductId, Product>();
  let customerMap = Map.empty<CustomerId, Customer>();
  let billMap = Map.empty<BillId, Bill>();
  let expenseMap = Map.empty<ExpenseId, Expense>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let ownerPrincipals = Map.empty<Principal, Bool>();

  let defaultOwnerStatus : OwnerStatus = {
    var isInitialized = false;
    var password = ?"24161852";
  };

  let ownerStatusMap = Map.fromIter<Principal, OwnerStatus>(
    [(Principal.fromText("2vxsx-fae"), defaultOwnerStatus)].values()
  );

  public shared ({ caller }) func changeOwnerPassword(currentPassword : Text, newPassword : Text) : async LoginResult {
    if (caller.isAnonymous()) {
      return #errorMessage("Anonymous Principal accounts cannot be authenticated as they lack private keys.");
    };
    let ownerStatus = switch (ownerStatusMap.get(caller)) {
      case (null) {
        let newStatus : OwnerStatus = {
          var isInitialized = false;
          var password = ?"24161852";
        };
        ownerStatusMap.add(caller, newStatus);
        newStatus;
      };
      case (?status) { status };
    };

    switch (ownerStatus.password) {
      case (?oldPassword) {
        if (oldPassword != currentPassword) {
          return #errorMessage("Incorrect password");
        };
        ownerStatus.password := ?newPassword;

        if (not ownerStatus.isInitialized) {
          ownerStatus.isInitialized := true;
          ownerPrincipals.add(caller, true);
        };

        let profile = {
          name = "Owner";
          role = "owner";
        };

        performOwnerBootstrap(caller);

        userProfiles.add(caller, profile);

        #ok(profile);
      };
      case (null) {
        #errorMessage("Password not set correctly");
      };
    };
  };

  public shared ({ caller }) func loginAsOwner(passwordAttempt : Text) : async LoginResult {
    if (caller.isAnonymous()) {
      return #errorMessage("Anonymous Principal accounts cannot be authenticated as they lack private keys.");
    };
    let ownerStatus = switch (ownerStatusMap.get(caller)) {
      case (null) {
        let newStatus : OwnerStatus = {
          var isInitialized = false;
          var password = ?"24161852";
        };
        ownerStatusMap.add(caller, newStatus);
        newStatus;
      };
      case (?status) { status };
    };

    switch (ownerStatus.password) {
      case (?password) {
        if (passwordAttempt == password) {
          if (not ownerStatus.isInitialized) {
            ownerStatus.isInitialized := true;
            ownerPrincipals.add(caller, true);
          };

          let profile = {
            name = "Owner";
            role = "owner";
          };

          performOwnerBootstrap(caller);

          userProfiles.add(caller, profile);

          #ok(profile);
        } else {
          #errorMessage("Incorrect password");
        };
      };
      case (null) {
        #errorMessage("Password not set correctly");
      };
    };
  };

  // Unifies admin role and owner bootstrap
  // This function is called only from owner login endpoints (loginAsOwner, changeOwnerPassword)
  // It directly assigns admin role without requiring the caller to already be an admin
  func performOwnerBootstrap(caller : Principal) {
    let currentRole = AccessControl.getUserRole(accessControlState, caller);

    switch (currentRole) {
      case (#guest or #user) {
        // Owner intended to be admin, initialize as admin if not already
        // Temporary fix: Call initialize with predefined and user-provided tokens
        // This now matches the expected access-control.mo signature
        AccessControl.initialize(accessControlState, caller, "ADMIN_TOKEN_OMK", "USER_TOKEN_OMK");

        AccessControl.assignRole(accessControlState, caller, caller, #admin);
      };
      case (#admin) {
        // Already admin, do nothing
      };
    };
  };

  public shared ({ caller }) func loginAsSalesman(password : Text) : async LoginResult {
    if (caller.isAnonymous()) {
      return #errorMessage("Anonymous Principal accounts cannot be authenticated as they lack private keys.");
    };

    if (password == "9961824357") {
      // For salesman login, check admin privileges before role assignment
      if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
        // Check if caller is admin (can assign roles)
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          return #errorMessage("Unauthorized: Only admins can assign user roles");
        };
        // Caller is admin, can assign user role to themselves
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };

      let profile = {
        name = "Salesman";
        role = "salesman";
      };
      userProfiles.add(caller, profile);

      return #ok(profile);
    } else {
      return #errorMessage("Incorrect password");
    };
  };

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

  // Product Management - Admin only for create/update/delete
  public shared ({ caller }) func createProduct(product : Product) : async () {
    requireAdmin(caller);
    if (productMap.containsKey(product.id)) {
      Runtime.trap("Product ID already exists");
    };
    productMap.add(product.id, product);
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    requireAdmin(caller);
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
    requireAdmin(caller);
    if (not productMap.containsKey(pid)) {
      Runtime.trap("Product not found");
    };
    productMap.remove(pid);
  };

  // Customer Management - Admin only for create/update/delete
  public shared ({ caller }) func createCustomer(customer : Customer) : async () {
    requireAdmin(caller);
    if (customerMap.containsKey(customer.id)) {
      Runtime.trap("Customer ID already exists");
    };
    customerMap.add(customer.id, customer);
  };

  public shared ({ caller }) func updateCustomer(customer : Customer) : async () {
    requireAdmin(caller);
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
    requireAdmin(caller);
    if (not customerMap.containsKey(cid)) {
      Runtime.trap("Customer not found");
    };
    customerMap.remove(cid);
  };

  // Bill Management - Users can create and view, only admins can delete
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
          let newAvailableInventory = Nat.sub(existingProduct.availableInventory, 1);
          let updatedProduct = {
            existingProduct with availableInventory = newAvailableInventory;
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
    requireAdmin(caller);
    if (not billMap.containsKey(bid)) {
      Runtime.trap("Bill not found");
    };
    billMap.remove(bid);
  };

  // Expense Management - Admin only
  public shared ({ caller }) func createExpense(expense : Expense) : async () {
    requireAdmin(caller);
    if (expenseMap.containsKey(expense.id)) {
      Runtime.trap("Expense ID already exists");
    };
    expenseMap.add(expense.id, expense);
  };

  public shared ({ caller }) func createExpenses(expenses : [Expense]) : async () {
    requireAdmin(caller);
    for (expense in expenses.values()) {
      if (expenseMap.containsKey(expense.id)) {
        Runtime.trap("Expense ID already exists");
      };
      expenseMap.add(expense.id, expense);
    };
  };

  public shared ({ caller }) func deleteExpense(eid : ExpenseId) : async () {
    requireAdmin(caller);
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
    requireAdmin(caller);
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

  func requireAdmin(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // New query to test login state for debugging and frontend purposes
  public query ({ caller }) func isCallerLoggedIn() : async Bool {
    switch (loggedInPrincipals.get(caller)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  // New endpoint to logout/clear login state
  public shared ({ caller }) func logout() : async () {
    loggedInPrincipals.remove(caller);
  };

  // Owner status helper query
  public query ({ caller }) func getOwnerStatus() : async Bool {
    switch (ownerStatusMap.get(caller)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Unified create/update owner (unused helper)
  func createOrUpdateOwnerStatus(principal : Principal, password : Text) {
    switch (ownerStatusMap.get(principal)) {
      case (null) {
        let newStatus : OwnerStatus = {
          var isInitialized = true;
          var password = ?password;
        };
        ownerStatusMap.add(principal, newStatus);
      };
      case (?status) {
        status.password := ?password;
        status.isInitialized := true;
      };
    };
  };

  // Bootstrap admin principal (unused helper)
  func bootstrapAdmin(principal : Principal, password : Text) {
    ownerPrincipals.add(principal, true);
    createOrUpdateOwnerStatus(principal, password);
  };
};
