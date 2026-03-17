import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, RefreshCw, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { OrderStatus, UserRole } from "../backend";
import { useAllOrders, useAllUsers } from "../hooks/useQueries";

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.requested]:
    "bg-warning/15 text-warning-foreground border-warning/30",
  [OrderStatus.storeConfirmed]: "bg-blue-100 text-blue-800 border-blue-300",
  [OrderStatus.riderAssigned]:
    "bg-purple-100 text-purple-800 border-purple-300",
  [OrderStatus.pickedUp]: "bg-orange-100 text-orange-800 border-orange-300",
  [OrderStatus.delivered]: "bg-primary/10 text-primary border-primary/30",
};

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.requested]: "Requested",
  [OrderStatus.storeConfirmed]: "Store Confirmed",
  [OrderStatus.riderAssigned]: "Rider Assigned",
  [OrderStatus.pickedUp]: "Picked Up",
  [OrderStatus.delivered]: "Delivered",
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.admin]: "Admin",
  [UserRole.customer]: "Customer",
  [UserRole.store]: "Vendor",
  [UserRole.deliveryP]: "Delivery",
};

export default function AdminPanel() {
  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useAllOrders();
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useAllUsers();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-foreground/70 font-medium">
            Manage all orders and users
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Orders",
            value: orders.length,
            color: "text-primary",
          },
          {
            label: "Active",
            value: orders.filter((o) => o.status !== OrderStatus.delivered)
              .length,
            color: "text-warning",
          },
          {
            label: "Delivered",
            value: orders.filter((o) => o.status === OrderStatus.delivered)
              .length,
            color: "text-primary",
          },
          { label: "Users", value: users.length, color: "text-chart-2" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 text-center shadow-card"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-foreground/70 font-semibold mt-0.5">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="orders" data-ocid="admin.tab">
        <TabsList className="mb-4">
          <TabsTrigger
            value="orders"
            className="gap-1.5"
            data-ocid="admin.orders.tab"
          >
            <Package className="w-3.5 h-3.5" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-1.5"
            data-ocid="admin.users.tab"
          >
            <Users className="w-3.5 h-3.5" />
            Users ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="flex justify-end mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOrders()}
              className="gap-1.5 border-2 font-semibold"
              data-ocid="admin.orders.refresh.button"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
          {ordersLoading ? (
            <div
              className="flex items-center gap-2 text-foreground/60 text-sm py-6 font-medium"
              data-ocid="admin.orders.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div
              className="text-center py-10 text-foreground/60 text-sm font-medium bg-muted/50 rounded-xl"
              data-ocid="admin.orders.empty_state"
            >
              No orders yet.
            </div>
          ) : (
            <div
              className="rounded-xl border border-border overflow-hidden shadow-card"
              data-ocid="admin.orders.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-bold text-foreground">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Item
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, i) => (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`admin.orders.row.${i + 1}`}
                    >
                      <TableCell className="text-xs font-mono text-foreground/60 font-semibold">
                        #{order.id.toString()}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {order.itemName}
                      </TableCell>
                      <TableCell className="text-xs text-foreground/60 font-mono">
                        {order.customerId.toString().slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${statusColors[order.status]}`}
                        >
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/60 font-medium">
                        {new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="flex justify-end mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchUsers()}
              className="gap-1.5 border-2 font-semibold"
              data-ocid="admin.users.refresh.button"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
          {usersLoading ? (
            <div
              className="flex items-center gap-2 text-foreground/60 text-sm py-6 font-medium"
              data-ocid="admin.users.loading_state"
            >
              <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
            </div>
          ) : users.length === 0 ? (
            <div
              className="text-center py-10 text-foreground/60 text-sm font-medium bg-muted/50 rounded-xl"
              data-ocid="admin.users.empty_state"
            >
              No users yet.
            </div>
          ) : (
            <div
              className="rounded-xl border border-border overflow-hidden shadow-card"
              data-ocid="admin.users.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-bold text-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Phone
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-bold text-foreground">
                      Joined
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, i) => (
                    <TableRow
                      key={user.id.toString()}
                      data-ocid={`admin.users.row.${i + 1}`}
                    >
                      <TableCell className="text-sm font-semibold text-foreground">
                        {user.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {user.phone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold text-foreground"
                        >
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/60 font-medium">
                        {new Date(
                          Number(user.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
