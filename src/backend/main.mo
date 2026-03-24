import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type PhoneNumber = Text;

  public type UserRole = {
    #customer;
    #store;
    #deliveryP;
    #admin;
  };

  public type Product = {
    productId : Int;
    name : Text;
    description : Text;
    price : Float;
    image : Text;
    vendorId : Principal;
    createdAt : Int;
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Int.compare(a.productId, b.productId);
    };
  };

  public type UserProfile = {
    id : Principal;
    phone : PhoneNumber;
    name : Text;
    role : UserRole;
    createdAt : Int;
  };

  public type OTP = {
    code : Text;
    expiresAt : Time.Time;
    verified : Bool;
  };

  public type OrderStatus = {
    #requested;
    #storeConfirmed;
    #riderAssigned;
    #pickedUp;
    #delivered;
  };

  public type Order = {
    id : Int;
    itemName : Text;
    customerId : Principal;
    status : OrderStatus;
    createdAt : Int;
  };

  module UserProfile {
    public func compare(p1 : UserProfile, p2 : UserProfile) : Order.Order {
      Text.compare(p1.phone, p2.phone);
    };
  };

  // Storage
  let users = Map.empty<Principal, UserProfile>();
  let products = Map.empty<Int, Product>();
  let otps = Map.empty<Text, OTP>();
  let orders = Map.empty<Int, Order>();
  var nextOrderId = 1;
  var nextProductId = 1;

  func isAppAdmin(principal : Principal) : Bool {
    switch (users.get(principal)) {
      case (null) { false };
      case (?profile) { profile.role == #admin };
    };
  };

  func getAppUserRole(principal : Principal) : ?UserRole {
    switch (users.get(principal)) {
      case (null) { null };
      case (?profile) { ?profile.role };
    };
  };

  public shared ({ caller }) func generateOtp(phone : PhoneNumber) : async Text {
    let t = Int.abs(Time.now());
    let raw = (t + phone.size()) % 900000;
    let code = (100000 + raw).toText();
    let otp = {
      code;
      expiresAt = Time.now() + 300_000_000_000;
      verified = false;
    };
    otps.add(phone, otp);
    code;
  };

  public shared ({ caller }) func verifyOtp(phone : PhoneNumber, code : Text) : async Bool {
    switch (otps.get(phone)) {
      case (null) { false };
      case (?otp) {
        if (code != otp.code) { false } else {
          if (Time.now() < otp.expiresAt) {
            let updatedOtp = { code = otp.code; expiresAt = otp.expiresAt; verified = true };
            otps.add(phone, updatedOtp);
            true;
          } else { false };
        };
      };
    };
  };

  public shared ({ caller }) func createUserProfile(phone : PhoneNumber, name : Text, role : UserRole) : async () {
    if (role == #admin and not isAppAdmin(caller)) {
      Runtime.trap("Only admin can create admin accounts");
    };
    let profile = { id = caller; phone; name; role; createdAt = Time.now() };
    users.add(caller, profile);
  };

  public shared ({ caller }) func updateUserRole(user : Principal, newRole : UserRole) : async () {
    if (not isAppAdmin(caller)) { Runtime.trap("Only admin can update user roles") };
    switch (users.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = { id = profile.id; phone = profile.phone; name = profile.name; role = newRole; createdAt = profile.createdAt };
        users.add(user, updatedProfile);
      };
    };
  };

  public query ({ caller }) func isNewUser(phone : PhoneNumber) : async Bool {
    for (user in users.values()) {
      if (user.phone == phone) { return false };
    };
    true;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public query ({ caller }) func getAllVendors() : async [UserProfile] {
    users.values().toArray().filter(func(p) { p.role == #store }).sort();
  };

  public query ({ caller }) func getAllCustomers() : async [UserProfile] {
    users.values().toArray().filter(func(p) { p.role == #customer }).sort();
  };

  // No AccessControl dependency - any logged-in user can get their own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (profile.id != caller) { Runtime.trap("Unauthorized: Can only save your own profile") };
    users.add(caller, profile);
  };

  public shared ({ caller }) func createOrder(itemName : Text) : async Int {
    // Allow any registered user to create an order (role check removed for demo)
    let orderId = nextOrderId;
    nextOrderId += 1;
    let order = { id = orderId; itemName; customerId = caller; status = #requested; createdAt = Time.now() };
    orders.add(orderId, order);
    orderId;
  };

  public query ({ caller }) func getOrderById(orderId : Int) : async ?Order {
    orders.get(orderId);
  };

  public query ({ caller }) func getOrdersByCustomer(customer : Principal) : async [Order] {
    if (caller != customer and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(o) { o.customerId == customer });
  };

  // Returns all orders matching the given status - accessible by any caller (shared demo data)
  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    orders.values().toArray().filter(func(o) { o.status == status });
  };

  // Allow any caller to update order status - role-based UI logic handled in frontend
  public shared ({ caller }) func updateOrderStatus(orderId : Int, newStatus : OrderStatus) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { id = order.id; itemName = order.itemName; customerId = order.customerId; status = newStatus; createdAt = order.createdAt };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not isAppAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can view all orders") };
    orders.values().toArray();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not isAppAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can view all users") };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getOrderStatus(orderId : Int) : async ?OrderStatus {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) { ?order.status };
    };
  };

  // Product Management - role enforcement handled in frontend via vendor password
  public shared ({ caller }) func addProduct(name : Text, description : Text, price : Float, image : Text) : async Int {
    let productId = nextProductId;
    nextProductId += 1;
    let product = {
      productId;
      name;
      description;
      price;
      image;
      vendorId = caller;
      createdAt = Time.now();
    };
    products.add(productId, product);
    productId;
  };

  public shared ({ caller }) func updateProduct(productId : Int, name : Text, description : Text, price : Float, image : Text) : async () {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updatedProduct = {
          productId;
          name;
          description;
          price;
          image;
          vendorId = product.vendorId;
          createdAt = product.createdAt;
        };
        products.add(productId, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Int) : async () {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        products.remove(productId);
      };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProductsByVendor(vendorId : Principal) : async [Product] {
    products.values().toArray().filter(func(p) { p.vendorId == vendorId }).sort();
  };
};
