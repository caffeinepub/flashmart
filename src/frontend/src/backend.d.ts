import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Store {
    customDeliveryZone: Array<[number, number]>;
    storeId: bigint;
    name: string;
    createdAt: bigint;
    description: string;
    isOpen: boolean;
    deliveryTime: string;
    vendorId: Principal;
    category: string;
    rating: number;
    image: string;
    useCustomZone: boolean;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: OrderStatus;
    customerPhone: string;
    storeId: bigint;
    createdAt: bigint;
    pinnedLongitude: number;
    pinnedLatitude: number;
    customerAddress: string;
    itemName: string;
    customerId: Principal;
}
export interface Product {
    storeId: bigint;
    name: string;
    createdAt: bigint;
    description: string;
    productId: bigint;
    vendorId: Principal;
    image: string;
    price: number;
}
export interface UserProfile {
    id: Principal;
    name: string;
    createdAt: bigint;
    role: UserRole;
    phone: string;
}
export enum OrderStatus {
    riderAssigned = "riderAssigned",
    requested = "requested",
    storeConfirmed = "storeConfirmed",
    pickedUp = "pickedUp",
    delivered = "delivered"
}
export enum UserRole {
    admin = "admin",
    customer = "customer",
    store = "store",
    deliveryP = "deliveryP"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(storeId: bigint, name: string, description: string, price: number, image: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createOrder(storeId: bigint, itemName: string, customerName: string, customerPhone: string, customerAddress: string, pinnedLatitude: number, pinnedLongitude: number): Promise<bigint>;
    createStore(name: string, image: string, category: string, description: string, deliveryTime: string): Promise<bigint>;
    createUserProfile(phone: string, name: string, role: UserRole): Promise<void>;
    deleteProduct(productId: bigint): Promise<void>;
    generateOtp(phone: string): Promise<string>;
    getAllCustomers(): Promise<Array<UserProfile>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllStores(): Promise<Array<Store>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAllVendors(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getOrderById(orderId: bigint): Promise<Order | null>;
    getOrderStatus(orderId: bigint): Promise<OrderStatus | null>;
    getOrdersByCustomer(customer: Principal): Promise<Array<Order>>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getProductsByVendor(vendorId: Principal): Promise<Array<Product>>;
    getStoreById(storeId: bigint): Promise<Store | null>;
    getStoreByVendor(vendorId: Principal): Promise<Store | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isNewUser(phone: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStoreDeliveryZone(storeId: bigint, zone: Array<[number, number]>, useCustom: boolean): Promise<void>;
    toggleStoreOpen(storeId: bigint): Promise<boolean>;
    updateOrderStatus(orderId: bigint, newStatus: OrderStatus): Promise<void>;
    updateProduct(productId: bigint, name: string, description: string, price: number, image: string): Promise<void>;
    updateStore(storeId: bigint, name: string, image: string, category: string, description: string, deliveryTime: string): Promise<void>;
    updateUserRole(user: Principal, newRole: UserRole): Promise<void>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
}
