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
import AccessControl "authorization/access-control";
import { migration } "StoreMigration";

(with migration)
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
    latitude : Float;
    longitude : Float;
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

  public type DeliveryLocation = {
    orderId : Int;
    lat : Float;
    lng : Float;
    updatedAt : Int;
    partnerId : Principal;
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
  let deliveryLocations = Map.empty<Int, DeliveryLocation>();
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
  public shared ({ caller }) func createStore(name : Text, image : Text, category : Text, description : Text, deliveryTime : Text, latitude : Float, longitude : Float) : async Int {
    if (not isRegisteredUser(caller)) {
      Runtime.trap("Unauthorized: Must be a registered user to create a store");
    };

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
      latitude;
      longitude;
    };

    stores.add(storeId, store);
    storeId;
  };

  public shared ({ caller }) func updateStore(storeId : Int, name : Text, image : Text, category : Text, description : Text, deliveryTime : Text) : async () {
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
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
          latitude = store.latitude;
          longitude = store.longitude;
        };
        stores.add(storeId, updatedStore);
      };
    };
  };

  // Admin-only: update store location after creation
  public shared ({ caller }) func updateStoreLocation(storeId : Int, latitude : Float, longitude : Float) : async () {
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update store location");
    };
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
        stores.add(storeId, { store with latitude; longitude });
      };
    };
  };

  public shared ({ caller }) func toggleStoreOpen(storeId : Int) : async Bool {
    switch (stores.get(storeId)) {
      case (null) { Runtime.trap("Store not found") };
      case (?store) {
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
          latitude = store.latitude;
          longitude = store.longitude;
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
    switch (otps.get(phone)) {
      case (null) { Runtime.trap("Unauthorized: OTP not found. Please generate OTP first") };
      case (?otp) {
        if (not otp.verified) {
          Runtime.trap("Unauthorized: OTP not verified. Please verify OTP first");
        };
      };
    };
    let profile = { id = caller; phone; name; role = #customer; createdAt = Time.now() };
    users.add(caller, profile);
  };

  public shared ({ caller }) func updateUserRole(user : Principal, newRole : UserRole) : async () {
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

  public query ({ caller }) func isNewUser(phone : Text) : async Bool {
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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (profile.id != caller) {
      Runtime.trap("Unauthorized: Can only save your own profile");
    };
    users.add(caller, profile);
  };

  public shared ({ caller }) func createOrder(storeId : Int, itemName : Text, customerName : Text, customerPhone : Text, customerAddress : Text, pinnedLatitude : Float, pinnedLongitude : Float) : async Int {
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
        let isCustomer = order.customerId == caller;
        let isStoreOwner = switch (stores.get(order.storeId)) {
          case (null) { false };
          case (?store) { store.vendorId == caller };
        };
        let isRegisteredCaller = isRegisteredUser(caller);
        let isAdmin = isAppAdmin(caller);

        let authorized = switch (order.status, newStatus) {
          case (#requested, #storeConfirmed) { isStoreOwner or isAdmin };
          case (#storeConfirmed, #riderAssigned) { isRegisteredCaller or isAdmin };
          case (#riderAssigned, #pickedUp) { isRegisteredCaller or isAdmin };
          case (#pickedUp, #delivered) { isRegisteredCaller or isAdmin };
          case (_, _) { isAdmin };
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
        let isCustomer = order.customerId == caller;
        let isStoreOwner = switch (stores.get(order.storeId)) {
          case (null) { false };
          case (?store) { store.vendorId == caller };
        };
        if (not isCustomer and not isStoreOwner and not isRegisteredUser(caller) and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only view orders you are involved in");
        };
        ?order;
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customer : Principal) : async [Order] {
    if (caller != customer and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(o) { o.customerId == customer });
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    if (not isRegisteredUser(caller) and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Must be a registered user to view orders");
    };
    orders.values().toArray().filter(func(o) { o.status == status });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getOrderStatus(orderId : Int) : async ?OrderStatus {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        let isCustomer = order.customerId == caller;
        let isStoreOwner = switch (stores.get(order.storeId)) {
          case (null) { false };
          case (?store) { store.vendorId == caller };
        };
        if (not isCustomer and not isStoreOwner and not isRegisteredUser(caller) and not isAppAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only check status of orders you are involved in");
        };
        ?order.status;
      };
    };
  };

  // Product Management
  public shared ({ caller }) func addProduct(storeId : Int, name : Text, description : Text, price : Float, image : Text) : async Int {
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

  // ==========================================
  // LIVE DELIVERY LOCATION TRACKING
  // ==========================================

  // Called by delivery partner every ~4 seconds while delivering
  public shared ({ caller }) func updateDeliveryLocation(orderId : Int, lat : Float, lng : Float) : async () {
    let loc = {
      orderId;
      lat;
      lng;
      updatedAt = Time.now();
      partnerId = caller;
    };
    deliveryLocations.add(orderId, loc);
  };

  // Called by customer for polling latest rider position
  public query ({ caller }) func getDeliveryLocation(orderId : Int) : async ?DeliveryLocation {
    deliveryLocations.get(orderId);
  };

  // Clean up location after delivery is complete
  public shared ({ caller }) func clearDeliveryLocation(orderId : Int) : async () {
    deliveryLocations.remove(orderId);
  };

};
