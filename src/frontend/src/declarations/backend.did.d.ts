/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface DeliveryLocation {
  orderId: bigint;
  lat: number;
  lng: number;
  updatedAt: bigint;
  partnerId: Principal;
}
export interface Order {
  'id' : bigint,
  'customerName' : string,
  'status' : OrderStatus,
  'customerPhone' : string,
  'storeId' : bigint,
  'createdAt' : bigint,
  'pinnedLongitude' : number,
  'pinnedLatitude' : number,
  'customerAddress' : string,
  'itemName' : string,
  'customerId' : Principal,
}
export type OrderStatus = { 'riderAssigned' : null } |
  { 'requested' : null } |
  { 'storeConfirmed' : null } |
  { 'pickedUp' : null } |
  { 'delivered' : null };
export interface Product {
  'storeId' : bigint,
  'name' : string,
  'createdAt' : bigint,
  'description' : string,
  'productId' : bigint,
  'vendorId' : Principal,
  'image' : string,
  'price' : number,
}
export interface Store {
  'storeId' : bigint,
  'name' : string,
  'createdAt' : bigint,
  'description' : string,
  'isOpen' : boolean,
  'deliveryTime' : string,
  'vendorId' : Principal,
  'category' : string,
  'rating' : number,
  'image' : string,
  'latitude' : number,
  'longitude' : number,
}
export interface UserProfile {
  'id' : Principal,
  'name' : string,
  'createdAt' : bigint,
  'role' : UserRole,
  'phone' : string,
}
export type UserRole = { 'admin' : null } |
  { 'customer' : null } |
  { 'store' : null } |
  { 'deliveryP' : null };
export type UserRole__1 = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'addProduct' : ActorMethod<[bigint, string, string, number, string], bigint>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole__1], undefined>,
  'clearDeliveryLocation' : ActorMethod<[bigint], undefined>,
  'createOrder' : ActorMethod<[bigint, string, string, string, string, number, number], bigint>,
  'createStore' : ActorMethod<[string, string, string, string, string, number, number], bigint>,
  'createUserProfile' : ActorMethod<[string, string, UserRole], undefined>,
  'deleteProduct' : ActorMethod<[bigint], undefined>,
  'generateOtp' : ActorMethod<[string], string>,
  'getAllCustomers' : ActorMethod<[], Array<UserProfile>>,
  'getAllOrders' : ActorMethod<[], Array<Order>>,
  'getAllProducts' : ActorMethod<[], Array<Product>>,
  'getAllStores' : ActorMethod<[], Array<Store>>,
  'getAllUsers' : ActorMethod<[], Array<UserProfile>>,
  'getAllVendors' : ActorMethod<[], Array<UserProfile>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole__1>,
  'getDeliveryLocation' : ActorMethod<[bigint], [] | [DeliveryLocation]>,
  'getOrderById' : ActorMethod<[bigint], [] | [Order]>,
  'getOrderStatus' : ActorMethod<[bigint], [] | [OrderStatus]>,
  'getOrdersByCustomer' : ActorMethod<[Principal], Array<Order>>,
  'getOrdersByStatus' : ActorMethod<[OrderStatus], Array<Order>>,
  'getProductsByVendor' : ActorMethod<[Principal], Array<Product>>,
  'getStoreById' : ActorMethod<[bigint], [] | [Store]>,
  'getStoreByVendor' : ActorMethod<[Principal], [] | [Store]>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'isNewUser' : ActorMethod<[string], boolean>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'toggleStoreOpen' : ActorMethod<[bigint], boolean>,
  'updateDeliveryLocation' : ActorMethod<[bigint, number, number], undefined>,
  'updateOrderStatus' : ActorMethod<[bigint, OrderStatus], undefined>,
  'updateProduct' : ActorMethod<[bigint, string, string, number, string], undefined>,
  'updateStore' : ActorMethod<[bigint, string, string, string, string, string], undefined>,
  'updateStoreLocation' : ActorMethod<[bigint, number, number], undefined>,
  'updateUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'verifyOtp' : ActorMethod<[string, string], boolean>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
