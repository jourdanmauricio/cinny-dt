import { atom } from 'jotai';

export type DtAdmin = { synapseUserId: string; displayName: string };
export const dtAdminsAtom = atom<DtAdmin[] | null>(null);
