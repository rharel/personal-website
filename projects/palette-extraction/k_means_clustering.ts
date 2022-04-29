function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export type Sample = number[];
export type Cluster = { mean: Sample; size: number };

export function k_means_clusters(
  samples: Sample[],
  cluster_count: number,
  initial_guess: Sample[],
  distance: (a: Sample, b: Sample) => number
): Cluster[] {
  const cluster_means = clone(initial_guess);
  let cluster_of_sample: number[] = new Array(samples.length).fill(-1);
  let cluster_size: number[] = new Array(cluster_count).fill(0);
  let clusters_changed = true;

  while (clusters_changed) {
    cluster_size.fill(0);
    clusters_changed = false;

    // Associate each sample with its nearest cluster mean.
    samples.forEach((sample, sample_index) => {
      let nearest_cluster_mean_index = 0;
      let nearest_cluster_mean_distance = distance(sample, cluster_means[0]);
      for (let i = 1; i < cluster_count; ++i) {
        const distance_to_cluster_mean_i = distance(sample, cluster_means[i]);
        if (distance_to_cluster_mean_i < nearest_cluster_mean_distance) {
          nearest_cluster_mean_distance = distance_to_cluster_mean_i;
          nearest_cluster_mean_index = i;
        }
      }

      if (
        cluster_of_sample[sample_index] === -1 ||
        cluster_of_sample[sample_index] !== nearest_cluster_mean_index
      ) {
        clusters_changed = true;
      }

      cluster_of_sample[sample_index] = nearest_cluster_mean_index;
      cluster_size[nearest_cluster_mean_index] += 1;
    });

    // Recompute the means.
    if (clusters_changed) {
      cluster_means.forEach((mean) => mean.fill(0));
      samples.forEach((sample, sample_index) => {
        const sample_cluster_index = cluster_of_sample[sample_index];
        const sample_cluster_size = cluster_size[sample_cluster_index];
        const cluster_mean = cluster_means[sample_cluster_index];
        cluster_mean.forEach(
          (_, i) => (cluster_mean[i] += sample[i] / sample_cluster_size)
        );
      });
    }
  }

  return cluster_means
    .map((mean, index) => {
      return {
        mean,
        size: cluster_size[index],
      };
    })
    .filter((cluster) => cluster.size > 0);
}
