import { useQuery } from '@tanstack/react-query';

// DT: contador de usuarias aprobadas por app + tipo/app de cada sala (endpoint público del backend DT)
export type DtAppOrigin = 'sugo' | 'contigo';
export type DtRoomType = 'group' | 'broadcast';

export type CommunityStats = {
  counts: Record<DtAppOrigin, number>;
  rooms: Record<string, { type: DtRoomType; appOrigin: DtAppOrigin }>;
};

export const DT_APP_LABEL: Record<DtAppOrigin, string> = { sugo: 'Sugo', contigo: 'Contigo' };

const fetchCommunityStats = async (): Promise<CommunityStats> => {
  const res = await fetch(`${import.meta.env.VITE_DT_API_URL}/matrix/community-stats`);
  if (!res.ok) throw new Error(`community-stats: ${res.status}`);
  return res.json();
};

/**
 * Se pide una sola vez por carga de la app (sin refresco periódico).
 * Si falla, devuelve undefined y la UI simplemente no muestra los números.
 */
export const useCommunityStats = (): CommunityStats | undefined => {
  const { data } = useQuery({
    queryKey: ['dt', 'community-stats'],
    queryFn: fetchCommunityStats,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return data;
};

export const formatUserCount = (count: number): string =>
  `${count.toLocaleString('es-AR')} ${count === 1 ? 'usuaria' : 'usuarias'}`;
