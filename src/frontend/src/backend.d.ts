import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PhoneNumber = string;
export interface Order {
    id: bigint;
    status: OrderStatus;
    createdAt: bigint;
    itemName: string;
    customerId: Principal;
}
export interface UserProfile {
    id: Principal;
    name: string;
    createdAt: bigint;
    role: UserRole;
    phone: PhoneNumber;
}
export interface Product {
    name: string;
    createdAt: bigint;
    description: string;
    productId: bigint;
    vendorId: Principal;
    image: string;
    price: number;
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
    addProduct(name: string, description: string, price: number, image: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createOrder(itemName: string): Promise<bigint>;
    createUserProfile(phone: PhoneNumber, name: string, role: UserRole): Promise<void>;
    deleteProduct(productId: bigint): Promise<void>;
    generateOtp(phone: PhoneNumber): Promise<string>;
    getAllCustomers(): Promise<Array<UserProfile>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getAllVendors(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getOrderById(orderId: bigint): Promise<Order | null>;
    getOrderStatus(orderId: bigint): Promise<OrderStatus | null>;
    getOrdersByCustomer(customer: Principal): Promise<Array<Order>>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getProductsByVendor(vendorId: Principal): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isNewUser(phone: PhoneNumber): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderStatus(orderId: bigint, newStatus: OrderStatus): Promise<void>;
    updateProduct(productId: bigint, name: string, description: string, price: number, image: string): Promise<void>;
    updateUserRole(user: Principal, newRole: UserRole): Promise<void>;
    verifyOtp(phone: PhoneNumber, code: string): Promise<boolean>;
}
