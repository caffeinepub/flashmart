import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// ── Module-level actor tracking so mutations can wait for the actor ────────
let _latestActor: backendInterface | null = null;
let _actorResolvers: Array<(actor: backendInterface) => void> = [];

export function _setLatestActor(actor: backendInterface | null) {
  _latestActor = actor;
  if (actor) {
    for (const resolve of _actorResolvers) {
      resolve(actor);
    }
    _actorResolvers = [];
  }
}

/**
 * Returns a promise that resolves when the actor is ready.
 * If the actor is already available it resolves immediately.
 * Rejects after `timeoutMs` (default 10 s) with a user-friendly message.
 */
export async function waitForActor(
  timeoutMs = 10_000,
): Promise<backendInterface> {
  if (_latestActor) return _latestActor;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      _actorResolvers = _actorResolvers.filter((r) => r !== resolve);
      reject(
        new Error(
          "Could not connect to backend. Please refresh and try again.",
        ),
      );
    }, timeoutMs);
    _actorResolvers.push((actor) => {
      clearTimeout(timer);
      resolve(actor);
    });
  });
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries and update module ref
  useEffect(() => {
    if (actorQuery.data) {
      _setLatestActor(actorQuery.data);
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    } else {
      _setLatestActor(null);
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
