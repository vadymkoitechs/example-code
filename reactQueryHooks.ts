interface createPlacePayload {
  name: string;
  content: string;
  location: string;
}

export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, createPlacePayload>(
    async (placeData) => {
      const { error } = await supabase.from('places').insert(placeData);

      if (error != null) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        void queryClient.invalidateQueries('places');
      }
    }
  );
}

interface createReviewPayload {
  content: string;
  rating: number;
  place_id: number;
  author_id: number;
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, createReviewPayload>(
    async (reviewData) => {
      const { error } = await supabase.from('reviews').insert(reviewData);

      if (error != null) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        void queryClient.invalidateQueries('reviews');
      }
    }
  );
}
