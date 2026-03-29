import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  // Old types without new fields
  type OldStore = {
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

  type OldActor = {
    stores : Map.Map<Int, OldStore>;
    users : Map.Map<Principal, { id : Principal; phone : Text; name : Text; role : { #customer; #store; #deliveryP; #admin }; createdAt : Int }>;
    products : Map.Map<Int, { productId : Int; storeId : Int; name : Text; description : Text; price : Float; image : Text; vendorId : Principal; createdAt : Int }>;
    otps : Map.Map<Text, { code : Text; expiresAt : Int; verified : Bool }>;
    orders : Map.Map<Int, { id : Int; storeId : Int; itemName : Text; customerName : Text; customerPhone : Text; customerAddress : Text; pinnedLatitude : Float; pinnedLongitude : Float; customerId : Principal; status : { #requested; #storeConfirmed; #riderAssigned; #pickedUp; #delivered }; createdAt : Int }>;
    nextOrderId : Nat;
    nextProductId : Nat;
    nextStoreId : Nat;
  };

  // New type with additional fields
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
    useCustomZone : Bool;
    customDeliveryZone : [(Float, Float)];
  };

  type NewActor = {
    stores : Map.Map<Int, NewStore>;
    users : Map.Map<Principal, { id : Principal; phone : Text; name : Text; role : { #customer; #store; #deliveryP; #admin }; createdAt : Int }>;
    products : Map.Map<Int, { productId : Int; storeId : Int; name : Text; description : Text; price : Float; image : Text; vendorId : Principal; createdAt : Int }>;
    otps : Map.Map<Text, { code : Text; expiresAt : Int; verified : Bool }>;
    orders : Map.Map<Int, { id : Int; storeId : Int; itemName : Text; customerName : Text; customerPhone : Text; customerAddress : Text; pinnedLatitude : Float; pinnedLongitude : Float; customerId : Principal; status : { #requested; #storeConfirmed; #riderAssigned; #pickedUp; #delivered }; createdAt : Int }>;
    nextOrderId : Nat;
    nextProductId : Nat;
    nextStoreId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newStores = old.stores.map<Int, OldStore, NewStore>(
      func(_id, oldStore) {
        {
          oldStore with
          useCustomZone = false;
          customDeliveryZone = ([] : [(Float, Float)]);
        };
      }
    );
    {
      old with
      stores = newStores;
    };
  };
};
