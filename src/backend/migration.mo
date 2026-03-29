import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Float "mo:core/Float";

module {
  type OldUserRole = {
    #customer;
    #store;
    #deliveryP;
    #admin;
  };

  type OldProduct = {
    productId : Int;
    name : Text;
    description : Text;
    price : Float;
    image : Text;
    vendorId : Principal;
    createdAt : Int;
  };

  type OldUserProfile = {
    id : Principal;
    phone : Text;
    name : Text;
    role : OldUserRole;
    createdAt : Int;
  };

  type OldOTP = {
    code : Text;
    expiresAt : Int;
    verified : Bool;
  };

  type OldOrderStatus = {
    #requested;
    #storeConfirmed;
    #riderAssigned;
    #pickedUp;
    #delivered;
  };

  type OldOrder = {
    id : Int;
    itemName : Text;
    customerId : Principal;
    status : OldOrderStatus;
    createdAt : Int;
  };

  type OldActor = {
    users : Map.Map<Principal, OldUserProfile>;
    products : Map.Map<Int, OldProduct>;
    otps : Map.Map<Text, OldOTP>;
    orders : Map.Map<Int, OldOrder>;
    nextOrderId : Nat;
    nextProductId : Nat;
  };

  type NewUserRole = {
    #customer;
    #store;
    #deliveryP;
    #admin;
  };

  type NewProduct = {
    productId : Int;
    storeId : Int;
    name : Text;
    description : Text;
    price : Float;
    image : Text;
    vendorId : Principal;
    createdAt : Int;
  };

  type NewStore = {
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
  };

  type NewUserProfile = {
    id : Principal;
    phone : Text;
    name : Text;
    role : NewUserRole;
    createdAt : Int;
  };

  type NewOTP = {
    code : Text;
    expiresAt : Int;
    verified : Bool;
  };

  type NewOrderStatus = {
    #requested;
    #storeConfirmed;
    #riderAssigned;
    #pickedUp;
    #delivered;
  };

  type NewOrder = {
    id : Int;
    storeId : Int;
    itemName : Text;
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    pinnedLatitude : Float;
    pinnedLongitude : Float;
    customerId : Principal;
    status : NewOrderStatus;
    createdAt : Int;
  };

  type NewActor = {
    users : Map.Map<Principal, NewUserProfile>;
    products : Map.Map<Int, NewProduct>;
    stores : Map.Map<Int, NewStore>;
    otps : Map.Map<Text, NewOTP>;
    orders : Map.Map<Int, NewOrder>;
    nextOrderId : Nat;
    nextProductId : Nat;
    nextStoreId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Int, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        {
          productId = oldProduct.productId;
          storeId = 0;
          name = oldProduct.name;
          description = oldProduct.description;
          price = oldProduct.price;
          image = oldProduct.image;
          vendorId = oldProduct.vendorId;
          createdAt = oldProduct.createdAt;
        };
      }
    );

    let newOrders = old.orders.map<Int, OldOrder, NewOrder>(
      func(_id, oldOrder) {
        {
          id = oldOrder.id;
          storeId = 0;
          itemName = oldOrder.itemName;
          customerName = "";
          customerPhone = "";
          customerAddress = "";
          pinnedLatitude = 0.0;
          pinnedLongitude = 0.0;
          customerId = oldOrder.customerId;
          status = oldOrder.status;
          createdAt = oldOrder.createdAt;
        };
      }
    );

    { 
      users = old.users;
      products = newProducts;
      otps = old.otps;
      orders = newOrders;
      nextOrderId = old.nextOrderId;
      nextProductId = old.nextProductId;
      stores = Map.empty<Int, NewStore>();
      nextStoreId = 1;
    };
  };
};
