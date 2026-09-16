import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Member } from '../types';

interface MembersContextValue {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string | undefined;
  setStatusFilter: (s: string | undefined) => void;
}

const MembersContext = createContext<MembersContextValue | null>(null);

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => {
    api<Member[]>('/api/members').then(setMembers);
  }, []);

  return (
    <MembersContext.Provider value={{ members, setMembers, search, setSearch, statusFilter, setStatusFilter }}>
      {children}
    </MembersContext.Provider>
  );
}

export function useMembers() {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error('useMembers must be used within MembersProvider');
  return ctx;
}