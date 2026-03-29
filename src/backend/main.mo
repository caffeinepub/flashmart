import Time "mo:core/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

import AccessControl "authorization/access-control";

// Specify data migration function in with-clause
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserRole = {
    #customer;
    #store;
    #deliveryP;
    #admin;
  };

  public type Product = {
    productId : Int;
    storeId : Int;
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

  public type Store = {
    storeId : Int;
    name : Text;
    image : Text;
    category : Text;
    description : Text;
    deliveryTime : Text;
    vendorId : Principal;
    isOpen : Bool;
    rating : Float;
    createdAt : Int;
    useCustomZone : Bool;
    customDeliveryZone : [(Float, Float)];
  };

  public type UserProfile = {
    id : Principal;
    phone : Text;
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
    storeId : Int;
    itemName : Text;
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    pinnedLatitude : Float;
    pinnedLongitude : Float;
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
  let stores = Map.empty<Int, Store>();
  let products = Map.empty<Int, Product>();
  let otps = Map.empty<Text, OTP>();
  let orders = Map.empty<Int, Order>();
  var nextOrderId : Nat = 1;
  var nextProductId : Nat = 1;
  var nextStoreId : Nat = 1;

  func isAppAdmin(principal : Principal) : Bool {
    switch (users.get(principal)) {
      case (null) { false };
      case (?profile) { profile.role == #admin };
    };
  };

  func isRegisteredUser(principal : Principal) : Bool {
    switch (users.get(principal)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Store Delivery Zones
  public shared ({ caller }) func setStoreDeliveryZone(storeId : Int, zone : [(Float, Float)], useCustom : Bool) : async () {
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        if (store.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only update your own store's delivery zone");
        };
        let updatedStore = { store with useCustomZone = useCustom; customDeliveryZone = zone };
        stores.add(storeId, updatedStore);
      };
    };
  };

  // Public - no authentication required (OTP generation is public)
  public shared ({ caller }) func generateOtp(phone : Text) : async Text {
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

  // Public - no authentication required (OTP verification is public)
  public shared ({ caller }) func verifyOtp(phone : Text, code : Text) : async Bool {
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

  // 1. Store Management
  public shared ({ caller }) func createStore(name : Text, image : Text, category : Text, description : Text, deliveryTime : Text) : async Int {
    // Authorization: Must be a registered user
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Must be a registered user to create a store");
    };

    // Check that store with caller as vendorId does not already exist
    let storeExists = stores.values().any(func(s) { s.vendorId == caller });
    if (storeExists) { Runtime.trap("Store already exists") };

    let storeId = nextStoreId;
    nextStoreId += 1;

    let store = {
      storeId;
      name;
      image;
      category;
      description;
      deliveryTime;
      vendorId = caller;
      isOpen = true;
      rating = 0.0;
      createdAt = Time.now();
      useCustomZone = false;
      customDeliveryZone = [];
    };

    stores.add(storeId, store);
    storeId;
  };

  public shared ({ caller }) func updateStore(storeId : Int, name : Text, image : Text, category : Text, description : Text, deliveryTime : Text) : async () {
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        // Authorization: Only store owner or admin can update
        if (store.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only update your own store");
        };

        let updatedStore = {
          storeId;
          name;
          image;
          category;
          description;
          deliveryTime;
          vendorId = store.vendorId;
          isOpen = store.isOpen;
          rating = store.rating;
          createdAt = store.createdAt;
          useCustomZone = store.useCustomZone;
          customDeliveryZone = store.customDeliveryZone;
        };
        stores.add(storeId, updatedStore);
      };
    };
  };

  public shared ({ caller }) func toggleStoreOpen(storeId : Int) : async Bool {
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        // Authorization: Only store owner or admin can toggle
        if (store.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only toggle your own store");
        };

        let updatedStore = {
          storeId = store.storeId;
          name = store.name;
          image = store.image;
          category = store.category;
          description = store.description;
          deliveryTime = store.deliveryTime;
          vendorId = store.vendorId;
          isOpen = not store.isOpen;
          rating = store.rating;
          createdAt = store.createdAt;
          useCustomZone = store.useCustomZone;
          customDeliveryZone = store.customDeliveryZone;
        };
        stores.add(storeId, updatedStore);
        updatedStore.isOpen;
      };
    };
  };

  public query ({ caller }) func getStoreByVendor(vendorId : Principal) : async ?Store {
    stores.values().find(func(store) { store.vendorId == vendorId });
  };

  public query ({ caller }) func getStoreById(storeId : Int) : async ?Store {
    stores.get(storeId);
  };

  public query ({ caller }) func getAllStores() : async [Store] {
    stores.values().toArray();
  };

  // User registration - requires verified OTP
  public shared ({ caller }) func createUserProfile(phone : Text, name : Text, role : UserRole) : async () {
    // Authorization: Verify OTP before allowing registration
    switch (otps.get(phone)) {
      case (null) { Runtime.trap("Unauthorized: OTP not found. Please generate OTP first") };
      case (?otp) {
        if (not otp.verified) {
          Runtime.trap("Unauthorized: OTP not verified. Please verify OTP first");
        };
      };
    };

    // All self-registrations are forced to customer role
    let profile = { id = caller; phone; name; role = #customer; createdAt = Time.now() };
    users.add(caller, profile);
  };

  public shared ({ caller }) func updateUserRole(user : Principal, newRole : UserRole) : async () {
    // Authorization: Only admins can update user roles
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update user roles");
    };

    switch (users.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = {
          id = profile.id;
          phone = profile.phone;
          name = profile.name;
          role = newRole;
          createdAt = profile.createdAt;
        };
        users.add(user, updatedProfile);
      };
    };
  };

  // Public - no authentication required (checking if user exists)
  public query ({ caller }) func isNewUser(phone : Text) : async Bool {
    for (user in users.values()) {
      if (user.phone == phone) { return false };
    };
    true;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Authorization: Can only view your own profile or admin can view any
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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Authorization: Can only save your own profile
    if (profile.id != caller) {
      Runtime.trap("Unauthorized: Can only save your own profile");
    };
    users.add(caller, profile);
  };

  public shared ({ caller }) func createOrder(storeId : Int, itemName : Text, customerName : Text, customerPhone : Text, customerAddress : Text, pinnedLatitude : Float, pinnedLongitude : Float) : async Int {
    // Authorization: Must be a registered user to create orders
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Must be a registered user to create orders");
    };

    let orderId = nextOrderId;
    nextOrderId += 1;
    let order = {
      id = orderId;
      storeId;
      itemName;
      customerName;
      customerPhone;
      customerAddress;
      pinnedLatitude;
      pinnedLongitude;
      customerId = caller;
      status = #requested;
      createdAt = Time.now();
    };
    orders.add(orderId, order);
    orderId;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Int, newStatus : OrderStatus) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        // Authorization: Different roles can update status based on current status
        let isCustomer = order.customerId == caller;
        let isStoreOwner = switch (stores.get(order.storeId)) {
          case (null) { false };
          case (?store) { store.vendorId == caller };
        };
        let isDeliveryPerson = switch (users.get(caller)) {
          case (null) { false };
          case (?profile) { profile.role == #deliveryP };
        };
        let isAdmin = isAppAdmin(caller);

        // Authorization rules based on status transitions:
        // - requested -> storeConfirmed: only store owner or admin
        // - storeConfirmed -> riderAssigned: only admin or delivery person
        // - riderAssigned -> pickedUp: only assigned delivery person or admin
        // - pickedUp -> delivered: only delivery person or admin
        let authorized = switch (order.status, newStatus) {
          case (#requested, #storeConfirmed) { isStoreOwner or isAdmin };
          case (#storeConfirmed, #riderAssigned) { isDeliveryPerson or isAdmin };
          case (#riderAssigned, #pickedUp) { isDeliveryPerson or isAdmin };
          case (#pickedUp, #delivered) { isDeliveryPerson or isAdmin };
          case (_, _) { isAdmin }; // Admin can make any transition
        };

        if (not authorized) {
          Runtime.trap("Unauthorized: Cannot update order status");
        };

        let updatedOrder = {
          id = order.id;
          storeId = order.storeId;
          itemName = order.itemName;
          customerName = order.customerName;
          customerPhone = order.customerPhone;
          customerAddress = order.customerAddress;
          pinnedLatitude = order.pinnedLatitude;
          pinnedLongitude = order.pinnedLongitude;
          customerId = order.customerId;
          status = newStatus;
          createdAt = order.createdAt;
        };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrderById(orderId : Int) : async ?Order {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        // Authorization: Only customer, store owner, delivery person, or admin can view
        let isCustomer = order.customerId == caller;
        let isStoreOwner = switch (stores.get(order.storeId)) {
          case (null) { false };
          case (?store) { store.vendorId == caller };
        };
        let isDeliveryPerson = switch (users.get(caller)) {
          case (null) { false };
          case (?profile) { profile.role == #deliveryP };
        };

        if (not isCustomer and not isStoreOwner and not isDeliveryPerson and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only view orders you are involved in");
        };

        ?order;
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customer : Principal) : async [Order] {
    // Authorization: Only the customer themselves or admin can view
    if (caller != customer and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };

    orders.values().toArray().filter(func(o) { o.customerId == customer });
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    // Authorization: Must be registered user to view orders by status
    if (not isRegisteredUser(caller) and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Must be a registered user to view orders");
    };

    orders.values().toArray().filter(func(o) { o.status == status });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    // Authorization: Only admins can view all orders
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    // Authorization: Only admins can view all users
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getOrderStatus(orderId : Int) : async ?OrderStatus {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        // Authorization: Only involved parties can check order status
        let isCustomer = order.customerId == caller;
        let isStoreOwner = switch (stores.get(order.storeId)) {
          case (null) { false };
          case (?store) { store.vendorId == caller };
        };
        let isDeliveryPerson = switch (users.get(caller)) {
          case (null) { false };
          case (?profile) { profile.role == #deliveryP };
        };

        if (not isCustomer and not isStoreOwner and not isDeliveryPerson and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only check status of orders you are involved in");
        };

        ?order.status;
      };
    };
  };

  // Product Management
  public shared ({ caller }) func addProduct(storeId : Int, name : Text, description : Text, price : Float, image : Text) : async Int {
    // Authorization: Verify caller owns the store
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        if (store.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only add products to your own store");
        };
      };
    };

    let productId = nextProductId;
    nextProductId += 1;
    let product = {
      productId;
      storeId;
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
        // Authorization: Only product owner or admin can update
        if (product.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only update your own products");
        };
        let updatedProduct = {
          productId;
          storeId = product.storeId;
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
        // Authorization: Only product owner or admin can delete
        if (product.vendorId != caller and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only delete your own products");
        };
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
