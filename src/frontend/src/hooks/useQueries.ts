import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderStatus, UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 30_000,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useMyOrders(customerId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["myOrders", customerId],
    queryFn: async () => {
      if (!actor || !customerId) return [];
      // get all orders by customer principal
      const { Principal } = await import("@dfinity/principal");
      return actor.getOrdersByCustomer(Principal.fromText(customerId));
    },
    enabled: !!actor && !actorFetching && !!customerId,
    refetchInterval: 5_000,
  });
}

export function useOrdersByStatus(status: OrderStatus) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["ordersByStatus", status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrdersByStatus(status);
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 5_000,
  });
}

export function useAllOrders() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["allOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10_000,
  });
}

export function useAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemName: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.createOrder(itemName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: bigint;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordersByStatus"] });
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}
