import React, { useState } from 'react';
import { School, ClassGroup, Subject, TimeSlot, Activity, ClassJournal } from '../types';
import { COLOR_PALETTE, getPaletteColor } from '../utils/storage';
import {
  Plus,
  Trash2,
  Check,
  X,
  Search,
  Calendar,
  AlertTriangle,
  Notebook,
  CheckSquare,
  Square,
  FileText,
  Bookmark,
  GraduationCap,
  BookOpen,
  Filter,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistroAtividadesProps {
  schools: School[];
  classes: ClassGroup[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  journals: ClassJournal[];
  setJournals: React.Dispatch<React.SetStateAction<ClassJournal[]>>;
  onDataChanged: () => void;
}

const DAYS_OF_WEEK_LABELS = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function RegistroAtividades({
  schools,
  classes,
  subjects,
  timeSlots,
  activities,
  setActivities,
  journals,
  setJournals,
  onDataChanged,
}: RegistroAtividadesProps) {
  // Main sub-tabs: 'activities' or 'journals'
  const [activeSubTab, setActiveSubTab] = useState<'activities' | 'journals'>('activities');

  // Search and Filter states
  const [actSearch, setActSearch] = useState('');
  const [actTypeFilter, setActTypeFilter] = useState<string>('todos');
  const [actClassFilter, setActClassFilter] = useState<string>('todos');
  const [actStatusFilter, setActStatusFilter] = useState<string>('todos'); // 'todos', 'pendentes', 'concluidos'

  // Journal Search and Filters
  const [jouSearch, setJouSearch] = useState('');
  const [jouClassFilter, setJouClassFilter] = useState<string>('todos');

  // Form toggles
  const [showActForm, setShowActForm] = useState(false);
  const [showJouForm, setShowJouForm] = useState(false);

  // Editing states
  const [editingActId, setEditingActId] = useState<string | null>(null);
  const [editingJouId, setEditingJouId] = useState<string | null>(null);

  // New Activity state
  const [newAct, setNewAct] = useState<{
    type: 'Avaliação' | 'Trabalho' | 'Tarefa' | 'Lembrete';
    title: string;
    description: string;
    dueDate: string;
    classGroupId: string;
    classGroupIds: string[];
    subjectId: string;
    priority: 'Baixa' | 'Média' | 'Alta';
  }>({
    type: 'Avaliação',
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    classGroupId: '',
    classGroupIds: [],
    subjectId: '',
    priority: 'Média',
  });

  // New Journal state
  const [newJou, setNewJou] = useState<{
    date: string;
    timeSlotId: string;
    customClassGroupId: string; // fallback if no timeslot selected
    customSubjectId: string; // fallback if no timeslot selected
    content: string;
    notes: string;
    useTimeSlot: boolean;
  }>({
    date: new Date().toISOString().split('T')[0],
    timeSlotId: '',
    customClassGroupId: '',
    customSubjectId: '',
    content: '',
    notes: '',
    useTimeSlot: true,
  });

  // Initialize form options
  React.useEffect(() => {
    if (classes.length > 0 && !newAct.classGroupId) {
      setNewAct(prev => ({
        ...prev,
        classGroupId: classes[0].id,
        classGroupIds: [classes[0].id]
      }));
    }
    if (subjects.length > 0 && !newAct.subjectId) {
      setNewAct(prev => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [classes, subjects, newAct.classGroupId, newAct.subjectId]);

  const handleToggleClassSelect = (classId: string) => {
    setNewAct(prev => {
      const alreadySelected = prev.classGroupIds.includes(classId);
      let updatedIds: string[];
      if (alreadySelected) {
        updatedIds = prev.classGroupIds.filter(id => id !== classId);
      } else {
        updatedIds = [...prev.classGroupIds, classId];
      }
      return {
        ...prev,
        classGroupIds: updatedIds,
        classGroupId: updatedIds[0] || '',
      };
    });
  };

  React.useEffect(() => {
    if (timeSlots.length > 0 && !newJou.timeSlotId) {
      setNewJou(prev => ({ ...prev, timeSlotId: timeSlots[0].id }));
    }
    if (classes.length > 0 && !newJou.customClassGroupId) {
      setNewJou(prev => ({ ...prev, customClassGroupId: classes[0].id }));
    }
    if (subjects.length > 0 && !newJou.customSubjectId) {
      setNewJou(prev => ({ ...prev, customSubjectId: subjects[0].id }));
    }
  }, [timeSlots, classes, subjects, newJou.timeSlotId, newJou.customClassGroupId, newJou.customSubjectId]);

  // Handle Edit Click for Activity
  const handleEditActivityClick = (act: Activity) => {
    setEditingActId(act.id);
    setNewAct({
      type: act.type,
      title: act.title,
      description: act.description,
      dueDate: act.dueDate,
      classGroupId: act.classGroupId,
      classGroupIds: act.classGroupIds || [act.classGroupId],
      subjectId: act.subjectId,
      priority: act.priority,
    });
    setShowActForm(true);
    const element = document.getElementById('btn-add-activity');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Cancel Activity Edit
  const handleCancelActivityEdit = () => {
    setShowActForm(false);
    setEditingActId(null);
    setNewAct(prev => ({
      ...prev,
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      classGroupIds: classes.length > 0 ? [classes[0].id] : [],
      classGroupId: classes.length > 0 ? classes[0].id : '',
    }));
  };

  // Handle Activity Create
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAct.title.trim()) {
      alert('Por favor, informe o título da atividade.');
      return;
    }
    if (newAct.classGroupIds.length === 0 || !newAct.subjectId) {
      alert('Por favor, certifique-se de vincular a atividade a pelo menos uma turma e componente curricular.');
      return;
    }

    if (editingActId) {
      setActivities(prev => prev.map(act => act.id === editingActId ? {
        ...act,
        type: newAct.type,
        title: newAct.title,
        description: newAct.description,
        dueDate: newAct.dueDate,
        classGroupId: newAct.classGroupIds[0],
        classGroupIds: newAct.classGroupIds,
        subjectId: newAct.subjectId,
        priority: newAct.priority,
      } : act));
      setEditingActId(null);
    } else {
      const activity: Activity = {
        id: `act-${Date.now()}`,
        type: newAct.type,
        title: newAct.title,
        description: newAct.description,
        dueDate: newAct.dueDate,
        classGroupId: newAct.classGroupIds[0],
        classGroupIds: newAct.classGroupIds,
        subjectId: newAct.subjectId,
        completed: false,
        priority: newAct.priority,
      };

      setActivities(prev => [activity, ...prev]);
    }

    setShowActForm(false);
    // Reset fields except defaults
    setNewAct(prev => ({
      ...prev,
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      classGroupIds: classes.length > 0 ? [classes[0].id] : [],
      classGroupId: classes.length > 0 ? classes[0].id : '',
    }));
    onDataChanged();
  };

  // Toggle activity completion
  const handleToggleComplete = (id: string) => {
    setActivities(prev =>
      prev.map(act => (act.id === id ? { ...act, completed: !act.completed } : act))
    );
    onDataChanged();
  };

  // Delete activity
  const handleDeleteActivity = (id: string) => {
    if (confirm('Deseja realmente remover esta atividade?')) {
      setActivities(prev => prev.filter(act => act.id !== id));
      if (editingActId === id) {
        setEditingActId(null);
      }
      onDataChanged();
    }
  };

  // Handle Edit Click for Journal
  const handleEditJournalClick = (jou: ClassJournal) => {
    setEditingJouId(jou.id);
    const isCustom = jou.timeSlotId.startsWith('custom_');
    let customClassGroupId = '';
    let customSubjectId = '';
    let timeSlotId = '';
    if (isCustom) {
      const parts = jou.timeSlotId.split('_');
      customClassGroupId = parts[1];
      customSubjectId = parts[2];
    } else {
      timeSlotId = jou.timeSlotId;
    }

    setNewJou({
      date: jou.date,
      timeSlotId,
      customClassGroupId,
      customSubjectId,
      content: jou.content,
      notes: jou.notes || '',
      useTimeSlot: !isCustom,
    });
    setShowJouForm(true);
    const element = document.getElementById('btn-add-journal');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Cancel Journal Edit
  const handleCancelJournalEdit = () => {
    setShowJouForm(false);
    setEditingJouId(null);
    setNewJou(prev => ({
      ...prev,
      content: '',
      notes: '',
    }));
  };

  // Handle Journal Create
  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJou.content.trim()) {
      alert('Por favor, detalhe o conteúdo lecionado.');
      return;
    }

    let resolvedTimeSlotId = '';
    if (newJou.useTimeSlot) {
      if (!newJou.timeSlotId) {
        alert('Selecione uma aula da grade de horários.');
        return;
      }
      resolvedTimeSlotId = newJou.timeSlotId;
    } else {
      resolvedTimeSlotId = `custom_${newJou.customClassGroupId}_${newJou.customSubjectId}`;
    }

    if (editingJouId) {
      setJournals(prev => prev.map(j => j.id === editingJouId ? {
        ...j,
        date: newJou.date,
        timeSlotId: resolvedTimeSlotId,
        content: newJou.content,
        notes: newJou.notes || undefined,
      } : j));
      setEditingJouId(null);
    } else {
      const journal: ClassJournal = {
        id: `jou-${Date.now()}`,
        date: newJou.date,
        timeSlotId: resolvedTimeSlotId,
        content: newJou.content,
        notes: newJou.notes || undefined,
      };

      setJournals(prev => [journal, ...prev]);
    }

    setShowJouForm(false);
    setNewJou(prev => ({
      ...prev,
      content: '',
      notes: '',
    }));
    onDataChanged();
  };

  // Delete Journal
  const handleDeleteJournal = (id: string) => {
    if (confirm('Deseja realmente remover este registro de conteúdo?')) {
      setJournals(prev => prev.filter(j => j.id !== id));
      if (editingJouId === id) {
        setEditingJouId(null);
      }
      onDataChanged();
    }
  };

  // Helper to resolve journal info (class and subject names)
  const resolveJournalInfo = (journal: ClassJournal) => {
    if (journal.timeSlotId.startsWith('custom_')) {
      const parts = journal.timeSlotId.split('_');
      const classId = parts[1];
      const subjectId = parts[2];
      const cls = classes.find(c => c.id === classId);
      const sub = subjects.find(s => s.id === subjectId);
      const sch = cls ? schools.find(s => s.id === cls.schoolId) : null;
      return {
        className: cls?.name || 'Turma Excluída',
        subjectName: sub?.name || 'Matéria Excluída',
        schoolName: sch?.name || 'Escola Excluída',
        subjectColor: sub?.color || 'Azul',
        timeLabel: 'Registro Avulso',
      };
    } else {
      const ts = timeSlots.find(t => t.id === journal.timeSlotId);
      const cls = ts ? classes.find(c => c.id === ts.classGroupId) : null;
      const sub = ts ? subjects.find(s => s.id === ts.subjectId) : null;
      const sch = cls ? schools.find(s => s.id === cls.schoolId) : null;
      return {
        className: cls?.name || 'Turma Excluída',
        subjectName: sub?.name || 'Matéria Excluída',
        schoolName: sch?.name || 'Escola Excluída',
        subjectColor: sub?.color || 'Azul',
        timeLabel: ts ? `${DAYS_OF_WEEK_LABELS[ts.dayOfWeek]} • ${ts.slotNumber}ª Aula (${ts.startTime})` : 'Horário Desconhecido',
      };
    }
  };

  // Filtered Activities list
  const filteredActivities = activities.filter(act => {
    const matchesSearch =
      act.title.toLowerCase().includes(actSearch.toLowerCase()) ||
      act.description.toLowerCase().includes(actSearch.toLowerCase());
    const matchesType = actTypeFilter === 'todos' || act.type === actTypeFilter;
    const matchesClass =
      actClassFilter === 'todos' ||
      act.classGroupId === actClassFilter ||
      (act.classGroupIds && act.classGroupIds.includes(actClassFilter));
    
    let matchesStatus = true;
    if (actStatusFilter === 'pendentes') matchesStatus = !act.completed;
    if (actStatusFilter === 'concluidos') matchesStatus = act.completed;

    return matchesSearch && matchesType && matchesClass && matchesStatus;
  });

  // Filtered Journals list
  const filteredJournals = journals.filter(jou => {
    const info = resolveJournalInfo(jou);
    const matchesSearch =
      jou.content.toLowerCase().includes(jouSearch.toLowerCase()) ||
      jou.notes?.toLowerCase().includes(jouSearch.toLowerCase()) ||
      info.className.toLowerCase().includes(jouSearch.toLowerCase()) ||
      info.subjectName.toLowerCase().includes(jouSearch.toLowerCase());

    let matchesClass = true;
    if (jouClassFilter !== 'todos') {
      if (jou.timeSlotId.startsWith('custom_')) {
        matchesClass = jou.timeSlotId.split('_')[1] === jouClassFilter;
      } else {
        const ts = timeSlots.find(t => t.id === jou.timeSlotId);
        matchesClass = ts ? ts.classGroupId === jouClassFilter : false;
      }
    }

    return matchesSearch && matchesClass;
  });

  return (
    <div id="registro-atividades-container" className="space-y-6">
      {/* Sub-Tab Bar for Activities vs Class Journal */}
      <div className="flex bg-white border border-slate-200 p-1.5 rounded-3xl shadow-2xs max-w-md mx-auto gap-1">
        <button
          id="subtab-activities"
          onClick={() => setActiveSubTab('activities')}
          className={`flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'activities'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckSquare size={16} />
          <span>Atividades e Eventos</span>
        </button>
        <button
          id="subtab-journals"
          onClick={() => setActiveSubTab('journals')}
          className={`flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'journals'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Notebook size={16} />
          <span>Diário de Conteúdos</span>
        </button>
      </div>

      {/* SECTION 1: ACTIVITIES MANAGEMENT */}
      {activeSubTab === 'activities' && (
        <div className="space-y-6">
          {/* Top Actions: Search and Filters + Add Button */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-3.5 text-slate-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar avaliações, trabalhos ou lembretes..."
                  value={actSearch}
                  onChange={e => setActSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all text-sm placeholder-slate-400"
                />
              </div>

              {/* Add Activity Button */}
              <button
                id="btn-add-activity"
                onClick={() => {
                  if (showActForm && editingActId) {
                    handleCancelActivityEdit();
                  } else {
                    setShowActForm(prev => !prev);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {showActForm ? <X size={18} /> : <Plus size={18} />}
                <span>{showActForm ? (editingActId ? 'Cancelar Edição' : 'Fechar Formulário') : 'Nova Atividade'}</span>
              </button>
            </div>

            {/* Quick Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-50">
              {/* Filter by Type */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 font-mono">TIPO:</span>
                <select
                  value={actTypeFilter}
                  onChange={e => setActTypeFilter(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-hidden"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="Avaliação">Avaliação</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Tarefa">Tarefa</option>
                  <option value="Lembrete">Lembrete</option>
                </select>
              </div>

              {/* Filter by Class */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 font-mono">TURMA:</span>
                <select
                  value={actClassFilter}
                  onChange={e => setActClassFilter(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-hidden"
                >
                  <option value="todos">Todas as Turmas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 font-mono">STATUS:</span>
                <select
                  value={actStatusFilter}
                  onChange={e => setActStatusFilter(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 focus:outline-hidden"
                >
                  <option value="todos">Pendentes & Concluídos</option>
                  <option value="pendentes">Pendentes</option>
                  <option value="concluidos">Concluídos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Create (Collapsible) */}
          <AnimatePresence>
            {showActForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleCreateActivity} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
                    {editingActId ? 'Editar Atividade / Evento' : 'Cadastrar Atividade / Evento'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Title */}
                    <div className="md:col-span-6">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Título da Atividade *</label>
                      <input
                        type="text"
                        placeholder="Ex: Prova Bimestral ou Entrega de Trabalho"
                        value={newAct.title}
                        onChange={e => setNewAct(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Type */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                      <select
                        value={newAct.type}
                        onChange={e => setNewAct(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden"
                      >
                        <option value="Avaliação">Avaliação 📝</option>
                        <option value="Trabalho">Trabalho 📁</option>
                        <option value="Tarefa">Tarefa 🏠</option>
                        <option value="Lembrete">Lembrete 🔔</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Prioridade</label>
                      <select
                        value={newAct.priority}
                        onChange={e => setNewAct(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden"
                      >
                        <option value="Alta">Alta 🔴</option>
                        <option value="Média">Média 🟡</option>
                        <option value="Baixa">Baixa 🔵</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Class */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Turma(s) Vinculada(s) *</label>
                      <div className="w-full h-28 overflow-y-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus-within:ring-1 focus-within:ring-indigo-500 space-y-2">
                        {classes.map(c => {
                          const isChecked = newAct.classGroupIds.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleClassSelect(c.id)}
                                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 font-sans"
                              />
                              <span>{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subject / Componente */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Componente Curricular</label>
                      <select
                        value={newAct.subjectId}
                        onChange={e => setNewAct(prev => ({ ...prev, subjectId: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Due Date */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Data de Entrega / Evento</label>
                      <input
                        type="date"
                        value={newAct.dueDate}
                        onChange={e => setNewAct(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Descrição / Detalhes</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Instruções de formatação, páginas de estudo ou material a ser trazido pelos alunos."
                      value={newAct.description}
                      onChange={e => setNewAct(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelActivityEdit}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {editingActId ? <Check size={16} /> : <Plus size={16} />}
                      <span>{editingActId ? 'Salvar Alterações' : 'Agendar'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activities List */}
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-xs text-slate-400 text-sm">
                Nenhuma atividade encontrada com os filtros aplicados.
              </div>
            ) : (
              filteredActivities.map(act => {
                const associatedClass = classes.find(c => c.id === act.classGroupId);
                const associatedSubject = subjects.find(s => s.id === act.subjectId);
                const associatedSchool = associatedClass ? schools.find(s => s.id === associatedClass.schoolId) : null;
                
                const subjectPalette = associatedSubject ? getPaletteColor(associatedSubject.color) : COLOR_PALETTE[0];
                const priorityColor =
                  act.priority === 'Alta'
                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                    : act.priority === 'Média'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100';

                const isOverdue = new Date(act.dueDate) < new Date(new Date().setHours(0,0,0,0)) && !act.completed;

                return (
                  <div
                    key={act.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white rounded-3xl border transition-all hover:border-slate-300 shadow-2xs gap-4 relative ${
                      act.completed ? 'opacity-65 border-slate-100' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(act.id)}
                        className={`mt-1 transition-all focus:outline-hidden cursor-pointer ${
                          act.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'
                        }`}
                        title={act.completed ? 'Marcar como Pendente' : 'Concluir Atividade'}
                      >
                        {act.completed ? (
                          <CheckCircle2 size={22} className="fill-emerald-50" />
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-md border-2 border-slate-200 hover:border-indigo-400 transition-all bg-white" />
                        )}
                      </button>

                      {/* Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${priorityColor}`}>
                            {act.priority}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-md">
                            {act.type}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Atrasada
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-extrabold text-slate-800 truncate leading-snug ${act.completed ? 'line-through text-slate-400' : ''}`}>
                          {act.title}
                        </h4>

                        {act.description && (
                          <p className={`text-sm text-slate-500 leading-relaxed ${act.completed ? 'line-through text-slate-400/80' : ''}`}>
                            {act.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-slate-400 font-medium">
                          <span className="flex flex-wrap items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-sm border border-slate-100 max-w-full">
                            <GraduationCap size={12} className="flex-shrink-0" />
                            <span>
                              {act.classGroupIds && act.classGroupIds.length > 0 ? (
                                act.classGroupIds
                                  .map(id => classes.find(c => c.id === id)?.name)
                                  .filter(Boolean)
                                  .join(', ')
                              ) : (
                                associatedClass?.name
                              )}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${subjectPalette.bg}`} />
                            {associatedSubject?.name}
                          </span>
                          <span className="text-slate-400 font-mono flex items-center gap-1">
                            <Calendar size={12} />
                            Entrega: {act.dueDate.split('-').reverse().join('/')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete and Action side */}
                    <div className="flex sm:flex-row items-center sm:items-center justify-between sm:justify-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <span className="text-[10px] text-slate-400 font-sans block sm:hidden">
                        Ações:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditActivityClick(act)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                          title="Editar Atividade"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
                          title="Remover Atividade"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: CLASS JOURNAL (CONTEÚDOS MINISTRADOS) */}
      {activeSubTab === 'journals' && (
        <div className="space-y-6">
          {/* Top Actions: Search and Filters + Add Button */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-3.5 text-slate-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por conteúdo, turma, matéria..."
                  value={jouSearch}
                  onChange={e => setJouSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all text-sm placeholder-slate-400"
                />
              </div>

              {/* Add Journal Button */}
              <button
                id="btn-add-journal"
                onClick={() => {
                  if (showJouForm && editingJouId) {
                    handleCancelJournalEdit();
                  } else {
                    setShowJouForm(prev => !prev);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {showJouForm ? <X size={18} /> : <Plus size={18} />}
                <span>{showJouForm ? (editingJouId ? 'Cancelar Edição' : 'Fechar Formulário') : 'Registrar Conteúdo'}</span>
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 font-mono">FILTRAR TURMA:</span>
              <select
                value={jouClassFilter}
                onChange={e => setJouClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-hidden max-w-xs"
              >
                <option value="todos">Todas as Turmas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Create Journal (Collapsible) */}
          <AnimatePresence>
            {showJouForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleCreateJournal} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
                    {editingJouId ? 'Editar Conteúdo Aplicado' : 'Registrar Conteúdo Aplicado'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Date */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Data da Aula</label>
                      <input
                        type="date"
                        value={newJou.date}
                        onChange={e => setNewJou(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans"
                      />
                    </div>

                    {/* Checkbox for custom vs scheduled slot selection */}
                    <div className="md:col-span-8 flex items-end pb-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newJou.useTimeSlot}
                          onChange={e => setNewJou(prev => ({ ...prev, useTimeSlot: e.target.checked }))}
                          className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Vincular a um horário agendado na Grade Semanal</span>
                      </label>
                    </div>
                  </div>

                  {newJou.useTimeSlot ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Selecione a Aula da Grade semanal *</label>
                      {timeSlots.length === 0 ? (
                        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                          Não há horários agendados na grade ainda. Por favor, desmarque a caixa acima para fazer um registro de aula avulso.
                        </div>
                      ) : (
                        <select
                          value={newJou.timeSlotId}
                          onChange={e => setNewJou(prev => ({ ...prev, timeSlotId: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden"
                        >
                          {timeSlots.map(ts => {
                            const cls = classes.find(c => c.id === ts.classGroupId);
                            const sub = subjects.find(s => s.id === ts.subjectId);
                            const sch = cls ? schools.find(s => s.id === cls.schoolId) : null;
                            return (
                              <option key={ts.id} value={ts.id}>
                                {DAYS_OF_WEEK_LABELS[ts.dayOfWeek]} - {ts.slotNumber}ª Aula ({ts.startTime}) | {cls?.name} • {sub?.name} ({sch?.name})
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Custom Class */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Turma *</label>
                        <select
                          value={newJou.customClassGroupId}
                          onChange={e => setNewJou(prev => ({ ...prev, customClassGroupId: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden"
                        >
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Subject */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Matéria *</label>
                        <select
                          value={newJou.customSubjectId}
                          onChange={e => setNewJou(prev => ({ ...prev, customSubjectId: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden"
                        >
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Content (O que foi ministrado) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Conteúdo Ministrado *</label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Introdução ao Princípio de Arquimedes (Empuxo). Resolução de exercícios das páginas 89 e 90."
                      value={newJou.content}
                      onChange={e => setNewJou(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Observações / Próxima Aula (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Faltou tempo para os últimos 2 exercícios. Retomar na próxima aula."
                      value={newJou.notes}
                      onChange={e => setNewJou(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelJournalEdit}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {editingJouId ? <Check size={16} /> : <Plus size={16} />}
                      <span>{editingJouId ? 'Salvar Alterações' : 'Registrar'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Journals List */}
          <div className="space-y-4">
            {filteredJournals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-xs text-slate-400 text-sm">
                Nenhum registro de conteúdo encontrado. Comece a registrar os tópicos lecionados!
              </div>
            ) : (
              filteredJournals.map(jou => {
                const info = resolveJournalInfo(jou);
                const palette = getPaletteColor(info.subjectColor);

                return (
                  <div
                    key={jou.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all space-y-3 relative group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1 font-mono">
                            <Calendar size={13} className="text-indigo-600" />
                            {jou.date.split('-').reverse().join('/')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans font-medium">
                            {info.timeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${palette.bg}`} />
                          <span className="font-semibold text-slate-700">{info.subjectName}</span>
                          <span className="text-slate-300">|</span>
                          <span className="font-semibold text-slate-700">{info.className}</span>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="text-slate-400 hidden sm:inline">{info.schoolName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditJournalClick(jou)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-100"
                          title="Editar Registro"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteJournal(jou.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-100"
                          title="Remover Registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                        {jou.content}
                      </p>
                    </div>

                    {/* Notes Section if exists */}
                    {jou.notes && (
                      <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50/30 p-2.5 rounded-xl border border-amber-50/50">
                        <Bookmark size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="italic">
                          <strong className="not-italic font-bold">Observações:</strong> {jou.notes}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
