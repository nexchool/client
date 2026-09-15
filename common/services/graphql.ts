import { apiPost, ApiException } from "@/common/services/api";

type GraphQLError = { message: string };
type GraphQLReply<T> = { data?: T | null; errors?: GraphQLError[] };

/**
 * POST one GraphQL operation and hand back `data`, or throw.
 *
 * GraphQL answers 200 with an `errors` array where REST would answer 4xx, so
 * without this every caller has to remember that a successful request can
 * still be a failure. Auth and tenant headers are identical to REST —
 * `apiPost` already attaches them — so this is a thin transport, not a new API.
 */
export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const reply = await apiPost<GraphQLReply<T>>("/api/graphql", {
    query,
    variables: variables ?? {},
  });
  const failure = reply.errors?.[0];
  if (failure) {
    throw new ApiException(failure.message || "Request failed");
  }
  if (reply.data === undefined || reply.data === null) {
    throw new ApiException("The server returned no data.");
  }
  return reply.data;
}
