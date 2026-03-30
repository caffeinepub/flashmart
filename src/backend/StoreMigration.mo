import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // OldStore reflects the current on-chain shape after the geofencing migration
  // (latitude/longitude already applied, customDeliveryZone removed)
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
    latitude : Float;
    longitude : Float;
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
    latitude : Float;
    longitude : Float;
  };

  public func migration(
    old : { stores : Map.Map<Int, OldStore> }
  ) : { stores : Map.Map<Int, NewStore> } {
    // Data is already in the correct shape — pass through as-is
    { stores = old.stores };
  };
};
