export interface MeetingTopic {
  id: string;
  title: string;
  discussion: string;
  decision: string;
  owner: string;
  dueDate: string;
}
export interface MeetingDetails {
  location: string;
  time: string;
  leader: string;
  noteTaker: string;
  topics: MeetingTopic[];
  minutesStatus: 'draft' | 'final';
  revision: number;
}
export interface MeetingGroup { id: string; title: string }
export interface Meeting { id: string; title: string; date: string; groupId?: string | null; details?: MeetingDetails }
export const emptyMeetingDetails = (): MeetingDetails => ({ location: '', time: '', leader: '', noteTaker: '', topics: [], minutesStatus: 'draft', revision: 0 });
