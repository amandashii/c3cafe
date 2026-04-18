export interface Year {
  id: string;
  label: string; // e.g. "2024–2025"
  created_at: string;
}

export interface Cohort {
  id: string;
  name: string; // e.g. "Fall 24", "Spring 25"
  created_at: string;
}

export interface Member {
  id: string;
  year_id: string;
  name: string;
  cohort_id: string | null;
  cohort_name?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
}

export type MemberFormData = {
  name: string;
  cohort_id: string;
  is_active: boolean;
};

export interface Request {
  id: string;
  year_id: string;
  member1_id: string;
  member2_id: string;
  note?: string;
  member1_name?: string;
  member2_name?: string;
  member1_cohort?: string;
  member2_cohort?: string;
  created_at: string;
}

export interface PairingWeek {
  id: string;
  year_id: string;
  week_number: number;
  date: string;
  pairs: Pair[];
}

export interface Pair {
  id: string;
  week_id: string;
  member1: PairMember;
  member2?: PairMember;
  member3?: PairMember;
  is_manual?: boolean; // came from requests queue
}

export interface PairMember {
  id: string;
  name: string;
  cohort_name: string;
}

export type Tab = 'roster' | 'pairings';
