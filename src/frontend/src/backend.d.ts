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
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createOrder(itemName: string): Promise<bigint>;
    createUserProfile(phone: PhoneNumber, name: string, role: UserRole): Promise<void>;
    generateOtp(phone: PhoneNumber): Promise<string>;
    getAllOrders(): Promise<Array<Order>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getOrderById(orderId: bigint): Promise<Order | null>;
    getOrderStatus(orderId: bigint): Promise<OrderStatus | null>;
    getOrdersByCustomer(customer: Principal): Promise<Array<Order>>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isNewUser(phone: PhoneNumber): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderStatus(orderId: bigint, newStatus: OrderStatus): Promise<void>;
    updateUserRole(user: Principal, newRole: UserRole): Promise<void>;
    verifyOtp(phone: PhoneNumber, code: string): Promise<boolean>;
}
