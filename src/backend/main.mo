import Time "mo:core/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
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
  let otps = Map.empty<Text, OTP>();
  let orders = Map.empty<Int, Order>();
  var nextOrderId = 1;

  // Helper function to check if user has admin role in our app
  func isAppAdmin(principal : Principal) : Bool {
    switch (users.get(principal)) {
      case (null) { false };
      case (?profile) { profile.role == #admin };
    };
  };

  // Helper function to get user role in our app
  func getAppUserRole(principal : Principal) : ?UserRole {
    switch (users.get(principal)) {
      case (null) { null };
      case (?profile) { ?profile.role };
    };
  };

  // OTP functions - accessible to anyone (guests)
  public shared ({ caller }) func generateOtp(phone : PhoneNumber) : async Text {
    // Generate 6-digit OTP
    let code = ((phone.size() + (Time.now() % 1000000)) % 1000000).toText();

    let otp = {
      code;
      expiresAt = Time.now() + 300_000_000_000; // 5 minutes in nanoseconds
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
            let updatedOtp = {
              code = otp.code;
              expiresAt = otp.expiresAt;
              verified = true;
            };
            otps.add(phone, updatedOtp);
            true;
          } else {
            false;
          };
        };
      };
    };
  };

  // User management
  public shared ({ caller }) func createUserProfile(phone : PhoneNumber, name : Text, role : UserRole) : async () {
    // Only allow role creation if authorized
    // Customers can self-register, but only admins can create vendor/delivery_partner/admin roles
    if (role != #customer and not isAppAdmin(caller)) {
      Runtime.trap("Only admin can create users with non-customer roles");
    };

    let profile = {
      id = caller;
      phone;
      name;
      role;
      createdAt = Time.now();
    };

    users.add(caller, profile);
  };

  public shared ({ caller }) func updateUserRole(user : Principal, newRole : UserRole) : async () {
    if (not isAppAdmin(caller)) {
      Runtime.trap("Only admin can update user roles");
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

  public query ({ caller }) func isNewUser(phone : PhoneNumber) : async Bool {
    for (user in users.values()) {
      if (user.phone == phone) { return false };
    };
    true;
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Can only view your own profile or admin can view any profile
    if (caller != user and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  // Required by frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  // Order management
  public shared ({ caller }) func createOrder(itemName : Text) : async Int {
    // Only customers can create orders
    switch (getAppUserRole(caller)) {
      case (null) { Runtime.trap("Unauthorized: User profile not found") };
      case (?role) {
        if (role != #customer) {
          Runtime.trap("Unauthorized: Only customers can create orders");
        };
      };
    };

    let orderId = nextOrderId;
    nextOrderId += 1;

    let order = {
      id = orderId;
      itemName;
      customerId = caller;
      status = #requested;
      createdAt = Time.now();
    };

    orders.add(orderId, order);
    orderId;
  };

  public query ({ caller }) func getOrderById(orderId : Int) : async ?Order {
    switch (orders.get(orderId)) {
      case (null) { null };
      case (?order) {
        // Customer can view their own orders, vendors/delivery partners/admins can view all
        if (order.customerId == caller or isAppAdmin(caller)) {
          ?order;
        } else {
          switch (getAppUserRole(caller)) {
            case (?#store) { ?order };
            case (?#deliveryP) { ?order };
            case (_) { Runtime.trap("Unauthorized: Can only view your own orders") };
          };
        };
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customer : Principal) : async [Order] {
    // Can only view your own orders or admin can view any
    if (caller != customer and not isAppAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    orders.values().toArray().filter(func(o) { o.customerId == customer });
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    // Only vendors, delivery partners, and admins can query by status
    switch (getAppUserRole(caller)) {
      case (?#store) { orders.values().toArray().filter(func(o) { o.status == status }) };
      case (?#deliveryP) { orders.values().toArray().filter(func(o) { o.status == status }) };
      case (?#admin) { orders.values().toArray().filter(func(o) { o.status == status }) };
      case (_) { Runtime.trap("Unauthorized: Only vendors, delivery partners, and admins can query by status") };
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Int, newStatus : OrderStatus) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        // Role-based authorization for status updates
        let callerRole = getAppUserRole(caller);

        // Validate status transition based on role
        switch (callerRole) {
          case (?#store) {
            // Vendors can only confirm orders (requested -> storeConfirmed)
            if (order.status != #requested or newStatus != #storeConfirmed) {
              Runtime.trap("Unauthorized: Vendors can only confirm requested orders");
            };
          };
          case (?#deliveryP) {
            // Delivery partners can update pickup and delivery status
            if (newStatus != #riderAssigned and newStatus != #pickedUp and newStatus != #delivered) {
              Runtime.trap("Unauthorized: Delivery partners can only update to riderAssigned, pickedUp, or delivered");
            };
          };
          case (?#admin) {
            // Admins can update to any status
          };
          case (_) {
            Runtime.trap("Unauthorized: Only vendors, delivery partners, and admins can update order status");
          };
        };

        let updatedOrder = {
          id = order.id;
          itemName = order.itemName;
          customerId = order.customerId;
          status = newStatus;
          createdAt = order.createdAt;
        };
        orders.add(orderId, updatedOrder);
      };
    };
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
        // Customer can view their own order status, vendors/delivery partners/admins can view all
        if (order.customerId == caller or isAppAdmin(caller)) {
          ?order.status;
        } else {
          switch (getAppUserRole(caller)) {
            case (?#store) { ?order.status };
            case (?#deliveryP) { ?order.status };
            case (_) { Runtime.trap("Unauthorized: Can only view your own order status") };
          };
        };
      };
    };
  };
};
