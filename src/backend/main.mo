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

  // Public - no authentication required
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

  // Public - no authentication required
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
    // Only admins can create admin accounts
    if (role == #admin and not isAppAdmin(caller)) {
      Runtime.trap("Only admin can create admin accounts");
    };
    
    let profile = { id = caller; phone; name; role; createdAt = Time.now() };
    users.add(caller, profile);
    
    // Register user in AccessControl system
    // Map app roles to AccessControl roles
    let accessRole = if (role == #admin) { #admin } else { #user };
    AccessControl.assignRole(accessControlState, caller, caller, accessRole);
  };

  public shared ({ caller }) func updateUserRole(user : Principal, newRole : UserRole) : async () {
    if (not isAppAdmin(caller)) { 
      Runtime.trap("Unauthorized: Only admins can update user roles") 
    };
    
    switch (users.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = { 
          id = profile.id; 
          phone = profile.phone; 
          name = profile.name; 
          role = newRole; 
          createdAt = profile.createdAt 
        };
        users.add(user, updatedProfile);
        
        // Update AccessControl role
        let accessRole = if (newRole == #admin) { #admin } else { #user };
        AccessControl.assignRole(accessControlState, caller, user, accessRole);
      };
    };
  };

  // Public - no authentication required
  public query ({ caller }) func isNewUser(phone : PhoneNumber) : async Bool {
    for (user in users.values()) {
      if (user.phone == phone) { return false };
    };
    true;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Can view own profile or admin can view any profile
    if (caller != user and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public query ({ caller }) func getAllVendors() : async [UserProfile] {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view vendors");
    };
    users.values().toArray().filter(func(p) { p.role == #store }).sort();
  };

  public query ({ caller }) func getAllCustomers() : async [UserProfile] {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view customers");
    };
    users.values().toArray().filter(func(p) { p.role == #customer }).sort();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can access profiles");
    };
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can save profiles");
    };
    
    if (profile.id != caller) { 
      Runtime.trap("Unauthorized: Can only save your own profile") 
    };
    
    users.add(caller, profile);
  };

  public shared ({ caller }) func createOrder(itemName : Text) : async Int {
    // Require at least user role (per spec: all registered users can create orders)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create orders");
    };
    
    let orderId = nextOrderId;
    nextOrderId += 1;
    let order = { 
      id = orderId; 
      itemName; 
      customerId = caller; 
      status = #requested; 
      createdAt = Time.now() 
    };
    orders.add(orderId, order);
    orderId;
  };

  public query ({ caller }) func getOrderById(orderId : Int) : async ?Order {
    // Require at least user role and verify ownership or admin
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view orders");
    };
    
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        if (order.customerId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        ?order;
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customer : Principal) : async [Order] {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view orders");
    };
    
    if (caller != customer and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(o) { o.customerId == customer });
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view orders");
    };
    orders.values().toArray().filter(func(o) { o.status == status });
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Int, newStatus : OrderStatus) : async () {
    // Require at least user role (per spec: role-based UI logic handled in frontend)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update order status");
    };
    
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { 
          id = order.id; 
          itemName = order.itemName; 
          customerId = order.customerId; 
          status = newStatus; 
          createdAt = order.createdAt 
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not isAppAdmin(caller)) { 
      Runtime.trap("Unauthorized: Only admins can view all orders") 
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not isAppAdmin(caller)) { 
      Runtime.trap("Unauthorized: Only admins can view all users") 
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getOrderStatus(orderId : Int) : async ?OrderStatus {
    // Require at least user role and verify ownership or admin
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view order status");
    };
    
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        if (order.customerId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        ?order.status;
      };
    };
  };

  // Product Management
  public shared ({ caller }) func addProduct(name : Text, description : Text, price : Float, image : Text) : async Int {
    // Require at least user role (per spec: all registered users can add products)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can add products");
    };
    
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
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update products");
    };
    
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        // Verify ownership or admin (per spec: no role enforcement, but ownership check is reasonable)
        if (product.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only update your own products");
        };
        
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
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can delete products");
    };
    
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        // Verify ownership or admin
        if (product.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only delete your own products");
        };
        
        products.remove(productId);
      };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view products");
    };
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProductsByVendor(vendorId : Principal) : async [Product] {
    // Require at least user role
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view products");
    };
    products.values().toArray().filter(func(p) { p.vendorId == vendorId }).sort();
  };
};
