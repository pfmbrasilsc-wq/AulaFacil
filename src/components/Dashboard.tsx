import React from 'react';
import { School, ClassGroup, Subject, TimeSlot, Activity, ClassJournal } from '../types';
import { COLOR_PALETTE, getPaletteColor } from '../utils/storage';
import {
  Calendar,
  Clock,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  Plus,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  schools: School[];
  classes: ClassGroup[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  journals: ClassJournal[];
  setView: (view: 'dashboard' | 'timetable' | 'activities' | 'config' | 'backup') => void;
  onDataChanged: () => void;
}

export default function Dashboard({
  schools,
  classes,
  subjects,
  timeSlots,
  activities,
  setActivities,
  // journals, // Not used in dashboard view anymore
  setView,
  onDataChanged,
}: DashboardProps) {

  // State for selected date (defaults to today's local date in YYYY-MM-DD format)
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // State for selected period/shift filter for classes
  const [selectedShift, setSelectedShift] = React.useState<'Todos' | 'Manhã' | 'Tarde' | 'Noite'>('Todos');

  // Selection states for class-group and subject on the selected date
  const [selectedClassGroupId, setSelectedClassGroupId] = React.useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string | null>(null);

  // Inline activity form states
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newActTitle, setNewActTitle] = React.useState('');
  const [newActType, setNewActType] = React.useState<'Avaliação' | 'Trabalho' | 'Tarefa' | 'Lembrete'>('Avaliação');
  const [newActPriority, setNewActPriority] = React.useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [newActSubjectId, setNewActSubjectId] = React.useState('');
  const [newActDescription, setNewActDescription] = React.useState('');
  const [newActDueDate, setNewActDueDate] = React.useState(selectedDate);

  // Sync newActDueDate when selectedDate changes
  React.useEffect(() => {
    setNewActDueDate(selectedDate);
  }, [selectedDate]);

  // Convert date string to weekday number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const getDayOfWeekFromDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getDay();
  };

  const selectedDayNum = getDayOfWeekFromDate(selectedDate);
  const selectedDayName = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][selectedDayNum];

  // Filter classes for the selected day of the week
  // Maps Sunday (0) to Monday (1) to show something by default if it's a Sunday, but otherwise we filter literally
  const activeDayOfWeekNum = selectedDayNum === 0 ? 1 : selectedDayNum;

  const dayClasses = React.useMemo(() => {
    let filtered = timeSlots.filter(t => t.dayOfWeek === activeDayOfWeekNum);
    
    // Filter classes by shift/period if selected
    if (selectedShift !== 'Todos') {
      filtered = filtered.filter(t => t.shift === selectedShift);
    }

    // Sort day's classes
    return [...filtered].sort((a, b) => {
      const shiftOrder = { Manhã: 1, Tarde: 2, Noite: 3 };
      if (shiftOrder[a.shift] !== shiftOrder[b.shift]) {
        return shiftOrder[a.shift] - shiftOrder[b.shift];
      }
      return a.slotNumber - b.slotNumber;
    });
  }, [timeSlots, activeDayOfWeekNum, selectedShift]);

  // Auto-select the first class-group from dayClasses when it changes
  React.useEffect(() => {
    if (dayClasses.length > 0) {
      const stillExists = dayClasses.some(slot => slot.classGroupId === selectedClassGroupId);
      if (!stillExists) {
        setSelectedClassGroupId(dayClasses[0].classGroupId);
        setSelectedSubjectId(dayClasses[0].subjectId);
      }
    } else {
      setSelectedClassGroupId(null);
      setSelectedSubjectId(null);
    }
    setShowAddForm(false);
  }, [dayClasses, selectedDate]);

  // Sync newActSubjectId when selectedSubjectId changes
  React.useEffect(() => {
    if (selectedSubjectId) {
      setNewActSubjectId(selectedSubjectId);
    } else if (subjects.length > 0) {
      setNewActSubjectId(subjects[0].id);
    }
  }, [selectedSubjectId, subjects]);

  // Toggle activity checkbox
  const handleToggleComplete = (id: string) => {
    setActivities(prev =>
      prev.map(act => (act.id === id ? { ...act, completed: !act.completed } : act))
    );
    onDataChanged();
  };

  // Handle activity deletion
  const handleDeleteActivity = (id: string) => {
    if (confirm('Deseja realmente remover esta atividade?')) {
      setActivities(prev => prev.filter(act => act.id !== id));
      onDataChanged();
    }
  };

  // Handle direct inline activity creation
  const handleCreateActivityInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim()) {
      alert('Por favor, informe o título da atividade.');
      return;
    }
    if (!selectedClassGroupId) {
      alert('Selecione uma turma para agendar a atividade.');
      return;
    }
    if (!newActSubjectId) {
      alert('Por favor, selecione uma disciplina.');
      return;
    }

    const activity: Activity = {
      id: `act-${Date.now()}`,
      type: newActType,
      title: newActTitle.trim(),
      description: newActDescription.trim(),
      dueDate: newActDueDate,
      classGroupId: selectedClassGroupId,
      classGroupIds: [selectedClassGroupId],
      subjectId: newActSubjectId,
      completed: false,
      priority: newActPriority,
    };

    setActivities(prev => [activity, ...prev]);
    onDataChanged();

    // Reset fields
    setNewActTitle('');
    setNewActDescription('');
    setShowAddForm(false);
  };

  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() - 1);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + 1);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleGoToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const getFormattedDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Date / Period Selector Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Data Selecionada</span>
            <span className="text-sm font-extrabold text-slate-800 capitalize">
              {getFormattedDate(selectedDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={handlePrevDay}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-all cursor-pointer"
            title="Dia Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => e.target.value && setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100/80 transition-all cursor-pointer focus:outline-hidden"
          />

          <button
            onClick={handleNextDay}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-all cursor-pointer"
            title="Próximo Dia"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-indigo-100/60"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Today's Schedule (Left 7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
              <span>Aulas de {selectedDayName}</span>
            </h3>
            
            {/* Period Shift Selector */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 self-start sm:self-center">
              {(['Todos', 'Manhã', 'Tarde', 'Noite'] as const).map(shift => (
                <button
                  key={shift}
                  onClick={() => setSelectedShift(shift)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedShift === shift
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {shift}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {dayClasses.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center space-y-2">
                <p className="text-slate-400 text-sm font-medium">
                  Não há aulas {selectedShift !== 'Todos' ? `no período da ${selectedShift.toLowerCase()}` : ''} cadastradas para {selectedDayName}.
                </p>
                <button
                  onClick={() => setView('timetable')}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Agendar horários agora
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              dayClasses.map(slot => {
                const associatedClass = classes.find(c => c.id === slot.classGroupId);
                const associatedSchool = associatedClass ? schools.find(s => s.id === associatedClass.schoolId) : null;
                const associatedSubject = subjects.find(s => s.id === slot.subjectId);

                const subjectPalette = associatedSubject ? getPaletteColor(associatedSubject.color) : COLOR_PALETTE[0];
                const schoolPalette = associatedSchool ? getPaletteColor(associatedSchool.color) : COLOR_PALETTE[0];

                const hasActivityToday = activities.some(act => 
                  act.dueDate === selectedDate && 
                  (act.classGroupId === slot.classGroupId || (act.classGroupIds && act.classGroupIds.includes(slot.classGroupId)))
                );

                const isSelected = selectedClassGroupId === slot.classGroupId;

                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      setSelectedClassGroupId(slot.classGroupId);
                      setSelectedSubjectId(slot.subjectId);
                    }}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 shadow-2xs cursor-pointer select-none active:scale-[0.99] hover:shadow-xs ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/25'
                        : hasActivityToday
                        ? 'bg-amber-50/85 border-amber-200/80 hover:border-amber-300 hover:bg-amber-50'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Left colored border */}
                      <div className={`w-3.5 h-12 rounded-lg ${subjectPalette.bg}`} />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-extrabold ${subjectPalette.text}`}>
                            {associatedSubject?.name}
                          </span>
                          <span className="text-[10px] bg-slate-50 text-slate-500 font-semibold px-2 py-0.5 rounded-md border border-slate-100">
                            {slot.slotNumber}ª Aula
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{associatedClass?.name}</span>
                          {hasActivityToday && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-sans">
                              Atividade
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${schoolPalette.bg}`} />
                          {associatedSchool?.name} ({slot.shift})
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono flex-shrink-0 border-l border-slate-100 pl-3">
                      <span className="text-sm font-bold text-slate-700">{slot.startTime}</span>
                      <span className="block text-[10px] text-slate-400">Até {slot.endTime}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Class Activities & Scheduling (Right 5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          {!selectedClassGroupId ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center space-y-3">
              <ClipboardList size={32} className="text-slate-400 mx-auto" />
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Nenhuma turma selecionada. Clique em uma aula ao lado para visualizar e agendar atividades.
              </p>
            </div>
          ) : (
            (() => {
            const selectedClass = classes.find(c => c.id === selectedClassGroupId);
            const classActivities = activities.filter(a => 
              a.dueDate === selectedDate && 
              (a.classGroupId === selectedClassGroupId || (a.classGroupIds && a.classGroupIds.includes(selectedClassGroupId)))
            );

            return (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider font-mono">Turma Selecionada</span>
                    <h3 className="text-sm font-extrabold text-slate-800 truncate">
                      {selectedClass?.name || 'Turma'}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setShowAddForm(prev => !prev)}
                      className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        showAddForm
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/60'
                      }`}
                    >
                      {showAddForm ? <X size={14} /> : <Plus size={14} />}
                      <span>{showAddForm ? 'Cancelar' : 'Agendar'}</span>
                    </button>
                  </div>
                </div>

                {showAddForm ? (
                  <form onSubmit={handleCreateActivityInline} className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-sans mb-1">
                      Agendar Atividade / Evento
                    </h4>

                    {/* Title */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título *</label>
                      <input
                        type="text"
                        placeholder="Ex: Prova Mensal, Trabalho, etc."
                        required
                        value={newActTitle}
                        onChange={e => setNewActTitle(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Type */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                        <select
                          value={newActType}
                          onChange={e => setNewActType(e.target.value as any)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
                        >
                          <option value="Avaliação">Avaliação 📝</option>
                          <option value="Trabalho">Trabalho 📁</option>
                          <option value="Tarefa">Tarefa 🏠</option>
                          <option value="Lembrete">Lembrete 🔔</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                        <select
                          value={newActPriority}
                          onChange={e => setNewActPriority(e.target.value as any)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
                        >
                          <option value="Alta">Alta 🔴</option>
                          <option value="Média">Média 🟡</option>
                          <option value="Baixa">Baixa 🔵</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Subject */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Disciplina *</label>
                        <select
                          value={newActSubjectId}
                          onChange={e => setNewActSubjectId(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden"
                        >
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data *</label>
                        <input
                          type="date"
                          required
                          value={newActDueDate}
                          onChange={e => setNewActDueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-sans text-slate-700 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição (opcional)</label>
                      <textarea
                        rows={2}
                        placeholder="Páginas do livro, detalhes, etc."
                        value={newActDescription}
                        onChange={e => setNewActDescription(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {classActivities.length === 0 ? (
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-8 text-center space-y-2">
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">
                          Nenhuma avaliação, trabalho ou tarefa agendada para esta turma nesta data.
                        </p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          Agendar Atividade
                        </button>
                      </div>
                    ) : (
                      classActivities.map(act => {
                        const associatedSubject = subjects.find(s => s.id === act.subjectId);
                        const isUrgent = act.priority === 'Alta';
                        const subjectPalette = associatedSubject ? getPaletteColor(associatedSubject.color) : COLOR_PALETTE[0];

                        return (
                          <div
                            key={act.id}
                            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                              act.completed 
                                ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/20 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                onClick={() => handleToggleComplete(act.id)}
                                className="mt-0.5 text-slate-300 hover:text-indigo-500 transition-all focus:outline-hidden flex-shrink-0 cursor-pointer"
                              >
                                <div className="w-5 h-5 rounded-md border-2 border-slate-200 hover:border-indigo-400 transition-all bg-white flex items-center justify-center">
                                  {act.completed && <Check size={14} className="text-indigo-600 font-extrabold" />}
                                </div>
                              </button>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm ${
                                    isUrgent ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                                  }`}>
                                    {act.type}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {act.priority} prioridade
                                  </span>
                                </div>

                                <h4 className={`font-extrabold text-slate-800 text-xs leading-snug break-words ${act.completed ? 'line-through text-slate-400' : ''}`}>
                                  {act.title}
                                </h4>

                                {act.description && (
                                  <p className="text-[11px] text-slate-500 leading-normal break-words">
                                    {act.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400">
                                  <span className={`w-1.5 h-1.5 rounded-full ${subjectPalette.bg}`} />
                                  <span className="truncate">
                                    {associatedSubject?.name}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 transition-all cursor-pointer flex-shrink-0"
                              title="Remover Atividade"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
