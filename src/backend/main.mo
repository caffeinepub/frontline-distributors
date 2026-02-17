import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type ProductId = Nat;
  public type CustomerId = Nat;
  public type BillId = Nat;
  public type ExpenseId = Nat;

  let ownerPassword = "24161852";
  let salesmanPassword = "12345";

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

  // Expense type definition
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

  // Persistent Maps
  let productMap = Map.empty<ProductId, Product>();
  let customerMap = Map.empty<CustomerId, Customer>();
  let billMap = Map.empty<BillId, Bill>();
  let expenseMap = Map.empty<ExpenseId, Expense>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Expenses Journeys
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

  public shared ({ caller }) func loginAsOwner(_username : Text, password : Text) : async LoginResult {
    if (not Text.equal(password, ownerPassword)) {
      #errorMessage("Authentication failed: Wrong password");
    } else {
      // Assign admin role in the access control system
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      
      let userProfile : UserProfile = {
        name = "Owner";
        role = "admin";
      };
      userProfiles.add(caller, userProfile);

      #ok(userProfile);
    };
  };

  public shared ({ caller }) func loginAsSalesman(_username : Text, password : Text) : async LoginResult {
    if (not Text.equal(password, salesmanPassword)) {
      #errorMessage("Authentication failed: Wrong password");
    } else {
      // Assign user role in the access control system
      AccessControl.assignRole(accessControlState, caller, caller, #user);

      let userProfile : UserProfile = {
        name = "Salesman";
        role = "user";
      };
      userProfiles.add(caller, userProfile);

      #ok(userProfile);
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
};
