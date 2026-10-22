import { create } from 'zustand';
import { Student, College } from '../types';

export interface NowViewingItem {
  type: 'student' | 'college';
  id: number;
  title: string;
  subtitle: string;
  apaar_or_code: string;
  status: string;
  score: number;
  photo_url?: string | null;
  state: string;
}

interface NowViewingState {
  item: NowViewingItem | null;
  setViewingStudent: (student: Student) => void;
  setViewingCollege: (college: College) => void;
  clearViewing: () => void;
}

export const useNowViewingStore = create<NowViewingState>((set) => ({
  item: {
    type: 'student',
    id: 1,
    title: 'Aarav Sharma',
    subtitle: 'Veermata Jijabai Technological Institute (VJTI)',
    apaar_or_code: '100000000007',
    status: 'Verified',
    score: 98.5,
    state: 'Maharashtra'
  },
  setViewingStudent: (s: Student) => set({
    item: {
      type: 'student',
      id: s.id,
      title: s.name,
      subtitle: s.college_name || 'AICTE Institution',
      apaar_or_code: s.apaar_id,
      status: s.verification_status,
      score: s.trust_score,
      photo_url: s.photo_url,
      state: s.state
    }
  }),
  setViewingCollege: (c: College) => set({
    item: {
      type: 'college',
      id: c.id,
      title: c.name,
      subtitle: `${c.district}, ${c.state}`,
      apaar_or_code: c.aicte_code,
      status: c.status,
      score: c.verification_score,
      state: c.state
    }
  }),
  clearViewing: () => set({ item: null })
}));
