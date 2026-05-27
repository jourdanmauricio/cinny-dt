export type DtLoginResponse = {
  token: string;
  userId: string;
  homeserver: string;
};

export const dtLogin = async (email: string, password: string): Promise<DtLoginResponse> => {
  const apiUrl = import.meta.env.VITE_DT_API_URL;
  const res = await fetch(`${apiUrl}/auth/cinny-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, errcode: data.message ?? 'Unknown' };
  }
  return res.json();
};
