import { School, ClassGroup, Subject, TimeSlot, Activity, ClassJournal } from '../types';

// Predefined palette for schools and subjects
export const COLOR_PALETTE = [
  { name: 'Azul', bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', hex: '#3b82f6', lightBg: 'bg-blue-50' },
  { name: 'Verde', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', hex: '#10b981', lightBg: 'bg-emerald-50' },
  { name: 'Violeta', bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-500', hex: '#8b5cf6', lightBg: 'bg-violet-50' },
  { name: 'Rosa', bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', hex: '#f43f5e', lightBg: 'bg-rose-50' },
  { name: 'Laranja', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', hex: '#f97316', lightBg: 'bg-orange-50' },
  { name: 'Ciano', bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', hex: '#06b6d4', lightBg: 'bg-cyan-50' },
  { name: 'Âmbar', bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', hex: '#d97706', lightBg: 'bg-amber-50' },
];

export const getPaletteColor = (colorName: string) => {
  return COLOR_PALETTE.find(c => c.name === colorName) || COLOR_PALETTE[0];
};

const INITIAL_SCHOOLS: School[] = [
  { id: 'sch-1', name: 'Escola Estadual Castro Alves', color: 'Azul', location: 'Centro' },
  { id: 'sch-2', name: 'Colégio Objetivo', color: 'Verde', location: 'Jardins' },
];

const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'cls-1', name: '1º Ano EM - A', schoolId: 'sch-1', shift: 'Manhã' },
  { id: 'cls-2', name: '2º Ano EM - B', schoolId: 'sch-1', shift: 'Manhã' },
  { id: 'cls-3', name: '9º Ano EF', schoolId: 'sch-2', shift: 'Tarde' },
  { id: 'cls-4', name: '3º Ano EM (Tercerão)', schoolId: 'sch-2', shift: 'Manhã' },
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Matemática', color: 'Azul' },
  { id: 'sub-2', name: 'Física', color: 'Violeta' },
  { id: 'sub-3', name: 'Geometria', color: 'Ciano' },
  { id: 'sub-4', name: 'Álgebra', color: 'Âmbar' },
];

const INITIAL_TIME_SLOTS: TimeSlot[] = [
  // Segunda-feira (1) - Manhã
  { id: 'slot-1', dayOfWeek: 1, shift: 'Manhã', slotNumber: 1, startTime: '07:30', endTime: '08:15', classGroupId: 'cls-1', subjectId: 'sub-1' },
  { id: 'slot-2', dayOfWeek: 1, shift: 'Manhã', slotNumber: 2, startTime: '08:15', endTime: '09:00', classGroupId: 'cls-1', subjectId: 'sub-1' },
  { id: 'slot-3', dayOfWeek: 1, shift: 'Manhã', slotNumber: 3, startTime: '09:00', endTime: '09:45', classGroupId: 'cls-2', subjectId: 'sub-2' },
  
  // Terça-feira (2) - Manhã & Tarde
  { id: 'slot-4', dayOfWeek: 2, shift: 'Manhã', slotNumber: 1, startTime: '07:30', endTime: '08:15', classGroupId: 'cls-4', subjectId: 'sub-2' },
  { id: 'slot-5', dayOfWeek: 2, shift: 'Manhã', slotNumber: 2, startTime: '08:15', endTime: '09:00', classGroupId: 'cls-4', subjectId: 'sub-1' },
  { id: 'slot-6', dayOfWeek: 2, shift: 'Tarde', slotNumber: 1, startTime: '13:15', endTime: '14:00', classGroupId: 'cls-3', subjectId: 'sub-3' },
  
  // Quarta-feira (3) - Manhã
  { id: 'slot-7', dayOfWeek: 3, shift: 'Manhã', slotNumber: 1, startTime: '07:30', endTime: '08:15', classGroupId: 'cls-2', subjectId: 'sub-1' },
  { id: 'slot-8', dayOfWeek: 3, shift: 'Manhã', slotNumber: 2, startTime: '08:15', endTime: '09:00', classGroupId: 'cls-1', subjectId: 'sub-2' },
  
  // Quinta-feira (4) - Manhã & Tarde
  { id: 'slot-9', dayOfWeek: 4, shift: 'Manhã', slotNumber: 2, startTime: '08:15', endTime: '09:00', classGroupId: 'cls-4', subjectId: 'sub-3' },
  { id: 'slot-10', dayOfWeek: 4, shift: 'Tarde', slotNumber: 2, startTime: '14:00', endTime: '14:45', classGroupId: 'cls-3', subjectId: 'sub-1' },

  // Sexta-feira (5) - Manhã
  { id: 'slot-11', dayOfWeek: 5, shift: 'Manhã', slotNumber: 1, startTime: '07:30', endTime: '08:15', classGroupId: 'cls-1', subjectId: 'sub-4' },
  { id: 'slot-12', dayOfWeek: 5, shift: 'Manhã', slotNumber: 3, startTime: '09:00', endTime: '09:45', classGroupId: 'cls-2', subjectId: 'sub-4' },
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: 'act-1', type: 'Avaliação', title: 'Prova de Trigonometria', description: 'Conteúdo: Seno, Cosseno, Tangente e Relações Métricas.', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], classGroupId: 'cls-1', subjectId: 'sub-1', completed: false, priority: 'Alta' },
  { id: 'act-2', type: 'Trabalho', title: 'Relatório de Laboratório de Física', description: 'Entregar o relatório do experimento sobre M.U.V.', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], classGroupId: 'cls-2', subjectId: 'sub-2', completed: false, priority: 'Média' },
  { id: 'act-3', type: 'Tarefa', title: 'Exercícios de Progressão Aritmética', description: 'Resolver páginas 45 a 47 do livro didático.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], classGroupId: 'cls-4', subjectId: 'sub-1', completed: true, priority: 'Baixa' },
  { id: 'act-4', type: 'Lembrete', title: 'Lançar Notas do 2º Bimestre', description: 'Último dia para lançar notas no portal escolar.', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], classGroupId: 'cls-3', subjectId: 'sub-3', completed: false, priority: 'Alta' },
];

const INITIAL_JOURNALS: ClassJournal[] = [
  { id: 'jou-1', date: new Date().toISOString().split('T')[0], timeSlotId: 'slot-1', content: 'Introdução ao círculo trigonométrico e definição de radianos.' },
  { id: 'jou-2', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], timeSlotId: 'slot-4', content: 'Resolução de problemas de Cinemática Escalar.' },
];

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`pedagogical_planner_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`pedagogical_planner_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
  }
};

export const initializeAppStorage = () => {
  if (!localStorage.getItem('pedagogical_planner_schools')) {
    saveToStorage('schools', INITIAL_SCHOOLS);
    saveToStorage('classes', INITIAL_CLASSES);
    saveToStorage('subjects', INITIAL_SUBJECTS);
    saveToStorage('time_slots', INITIAL_TIME_SLOTS);
    saveToStorage('activities', INITIAL_ACTIVITIES);
    saveToStorage('journals', INITIAL_JOURNALS);
  }
};
