import { DtAppOrigin } from '../../hooks/useCommunityStats';

// DT: búsqueda de personas por ID de Sugo/Contigo (solo admins).
// Se autentica con el token de Matrix de la sesión, no con el JWT de DT.
export type AppIdMatch = {
  synapseUserId: string;
  displayName: string | null;
  sugoId: string;
  appOrigin: DtAppOrigin;
};

export class AppIdSearchError extends Error {}

type AccessTokenSource = { getAccessToken: () => string | null };

export const searchByAppId = async (
  mx: AccessTokenSource,
  appId: string
): Promise<AppIdMatch[]> => {
  const apiUrl = import.meta.env.VITE_DT_API_URL;
  let res: Response;
  try {
    res = await fetch(`${apiUrl}/matrix/by-app-id?appId=${encodeURIComponent(appId)}`, {
      headers: { Authorization: `Bearer ${mx.getAccessToken() ?? ''}` },
    });
  } catch {
    throw new AppIdSearchError('No se pudo conectar con el servidor. Intentá de nuevo.');
  }
  if (res.status === 401 || res.status === 403) {
    throw new AppIdSearchError('No tenés permisos para buscar por ID de Sugo/Contigo.');
  }
  if (!res.ok) throw new AppIdSearchError('No se pudo buscar el ID. Intentá de nuevo.');
  return res.json();
};
