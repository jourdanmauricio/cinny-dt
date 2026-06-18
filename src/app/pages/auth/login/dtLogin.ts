export type DtLoginResponse = {
  token: string;
  deviceId: string;
  dtToken: string;
  userId: string;
  homeserver: string;
  isAdmin: boolean;
};

export const dtLogin = async (email: string, password: string, turnstileToken?: string): Promise<DtLoginResponse> => {
  const apiUrl = import.meta.env.VITE_DT_API_URL;
  const res = await fetch(`${apiUrl}/auth/cinny-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, turnstileToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { status: res.status, errcode: data.message ?? 'Unknown' };
  }
  return res.json();
};
