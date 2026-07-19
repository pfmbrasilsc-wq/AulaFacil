export interface School {
  id: string;
  name: string;
  color: string; // Tailwind color name or hex
  location?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  schoolId: string;
  shift: 'Manhã' | 'Tarde' | 'Noite';
}

export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color name or hex
}

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  shift: 'Manhã' | 'Tarde' | 'Noite';
  slotNumber: number; // 1st class, 2nd class, etc.
  startTime: string; // e.g. "07:30"
  endTime: string; // e.g. "08:15"
  classGroupId: string; // references ClassGroup
  subjectId: string; // references Subject
}

export interface Activity {
  id: string;
  type: 'Avaliação' | 'Trabalho' | 'Tarefa' | 'Lembrete';
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  classGroupId: string; // references ClassGroup
  classGroupIds?: string[]; // references multiple ClassGroups
  subjectId: string; // references Subject
  completed: boolean;
  priority: 'Baixa' | 'Média' | 'Alta';
}

export interface ClassJournal {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlotId: string; // references TimeSlot
  content: string; // What was taught
  notes?: string; // Additional observations
}
