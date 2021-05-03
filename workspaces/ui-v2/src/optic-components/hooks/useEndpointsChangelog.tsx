import { useSpectacleQuery } from '<src>/spectacle-implementations/spectacle-provider';

//@todo not working as expected -- never any changes
export const endpointChangeQuery = `query X($sinceBatchCommitId: String) {
    endpointChanges(sinceBatchCommitId: $sinceBatchCommitId) {
      endpoints {
        change {
          category
        }
        pathId
        method
      }
    }
}`;

type EndpointChangeQueryResults = {
  endpointChanges: {
    endpoints: any;
  };
};

type EndpointChangeQueryInput = {
  sinceBatchCommitId?: string;
};

export function useEndpointsChangelog(
  sinceBatchCommitId?: string
): EndpointChangeQueryResults[] {
  const queryResults = useSpectacleQuery<
    EndpointChangeQueryResults[],
    EndpointChangeQueryInput
  >({
    query: endpointChangeQuery,
    variables: {
      sinceBatchCommitId,
    },
  });

  return queryResults.data || [];
}
