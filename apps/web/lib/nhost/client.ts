import { createClient } from '@nhost/nhost-js';

export function createNhostClient() {
  return createClient({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
    region: process.env.NEXT_PUBLIC_NHOST_REGION,
    authUrl: process.env.NEXT_PUBLIC_NHOST_AUTH_URL,
    storageUrl: process.env.NEXT_PUBLIC_NHOST_STORAGE_URL,
    graphqlUrl: process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
    functionsUrl: process.env.NEXT_PUBLIC_NHOST_FUNCTIONS_URL,
  });
}
