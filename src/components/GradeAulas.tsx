import React, { useState } from 'react';
import { School, ClassGroup, Subject, TimeSlot } from '../types';
import { COLOR_PALETTE, getPaletteColor } from '../utils/storage';
import { Plus, Trash2, Edit2, X, Clock, Calendar, Check, AlertCircle, Copy, MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GradeAulasProps {
  schools: School[];
  classes: ClassGroup[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  setTimeSlots: React.Dispatch<React.SetStateAction<TimeSlot[]>>;
  onDataChanged: () => void;
}

const SHIFT_LABELS: Record<'Manhã' | 'Tarde' | 'Noite', string> = {
  Manhã: 'Matutino',
  Tarde: 'Vespertino',
  Noite: 'Noturno',
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const DEFAULT_TIME_PRESETS = {
  Manhã: [
    { slot: 1, start: '07:30', end: '08:15' },
    { slot: 2, start: '08:15', end: '09:00' },
    { slot: 3, start: '09:00', end: '09:45' },
    { slot: 4, start: '10:00', end: '10:45' },
    { slot: 5, start: '10:45', end: '11:30' },
    { slot: 6, start: '11:30', end: '12:15' },
  ],
  Tarde: [
    { slot: 1, start: '13:15', end: '14:00' },
    { slot: 2, start: '14:00', end: '14:45' },
    { slot: 3, start: '15:00', end: '15:45' },
    { slot: 4, start: '15:45', end: '16:30' },
    { slot: 5, start: '16:30', end: '17:15' },
    { slot: 6, start: '17:15', end: '18:00' },
  ],
  Noite: [
    { slot: 1, start: '18:30', end: '19:10' },
    { slot: 2, start: '19:10', end: '19:50' },
    { slot: 3, start: '20:00', end: '20:40' },
    { slot: 4, start: '20:40', end: '21:20' },
    { slot: 5, start: '21:20', end: '22:00' },
  ],
};

export default function GradeAulas({
  schools,
  classes,
  subjects,
  timeSlots,
  setTimeSlots,
  onDataChanged,
}: GradeAulasProps) {
  const [selectedShift, setSelectedShift] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');
  const [showSaturday, setShowSaturday] = useState<boolean>(false);
  
  // Mobile day selection (defaults to Monday / 1)
  const [selectedDayMobile, setSelectedDayMobile] = useState<number>(1);

  // Modal / Form state for scheduling a slot
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  
  const [modalData, setModalData] = useState<{
    dayOfWeek: number;
    shift: 'Manhã' | 'Tarde' | 'Noite';
    slotNumber: number;
    startTime: string;
    endTime: string;
    classGroupId: string;
    subjectId: string;
  }>({
    dayOfWeek: 1,
    shift: 'Manhã',
    slotNumber: 1,
    startTime: '07:30',
    endTime: '08:15',
    classGroupId: '',
    subjectId: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Maximum slot numbers to show in the grid
  const maxSlots = selectedShift === 'Noite' ? 5 : 6;
  const slotRange = Array.from({ length: maxSlots }, (_, i) => i + 1);

  const filteredDays = showSaturday ? DAYS_OF_WEEK : DAYS_OF_WEEK.slice(0, 5);

  // Helper to find a slot
  const findTimeSlot = (day: number, shift: 'Manhã' | 'Tarde' | 'Noite', slot: number) => {
    return timeSlots.find(t => t.dayOfWeek === day && t.shift === shift && t.slotNumber === slot);
  };

  // Open modal to Add
  const handleAddClick = (day: number, shift: 'Manhã' | 'Tarde' | 'Noite', slot: number) => {
    if (classes.length === 0 || subjects.length === 0) {
      alert('Por favor, cadastre primeiro as turmas e disciplinas na aba de "Cadastros"!');
      return;
    }

    const preset = DEFAULT_TIME_PRESETS[shift].find(p => p.slot === slot) || { start: '07:30', end: '08:15' };
    
    // Set default class id to first available class group
    const initialClassId = classes[0]?.id || '';

    setModalData({
      dayOfWeek: day,
      shift: shift,
      slotNumber: slot,
      startTime: preset.start,
      endTime: preset.end,
      classGroupId: initialClassId,
      subjectId: subjects[0]?.id || '',
    });
    setEditingSlotId(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal to Edit
  const handleEditClick = (slot: TimeSlot) => {
    setModalData({
      dayOfWeek: slot.dayOfWeek,
      shift: slot.shift,
      slotNumber: slot.slotNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
      classGroupId: slot.classGroupId,
      subjectId: slot.subjectId,
    });
    setEditingSlotId(slot.id);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Change modal shift -> updates presets
  const handleModalShiftChange = (newShift: 'Manhã' | 'Tarde' | 'Noite') => {
    const preset = DEFAULT_TIME_PRESETS[newShift].find(p => p.slot === modalData.slotNumber) || DEFAULT_TIME_PRESETS[newShift][0];
    setModalData(prev => ({
      ...prev,
      shift: newShift,
      startTime: preset?.start || '07:30',
      endTime: preset?.end || '08:15',
    }));
  };

  // Change modal slot number -> updates presets
  const handleModalSlotNumberChange = (newSlotNum: number) => {
    const preset = DEFAULT_TIME_PRESETS[modalData.shift].find(p => p.slot === newSlotNum);
    setModalData(prev => ({
      ...prev,
      slotNumber: newSlotNum,
      startTime: preset ? preset.start : prev.startTime,
      endTime: preset ? preset.end : prev.endTime,
    }));
  };

  // Save the Scheduled Class
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData.classGroupId) {
      setFormError('Selecione uma turma.');
      return;
    }
    if (!modalData.subjectId) {
      setFormError('Selecione uma disciplina.');
      return;
    }
    if (!modalData.startTime || !modalData.endTime) {
      setFormError('Insira os horários de início e fim.');
      return;
    }

    // Check conflict (another class at the same day, shift, slot) excluding the current editing slot
    const conflict = timeSlots.find(
      t =>
        t.dayOfWeek === modalData.dayOfWeek &&
        t.shift === modalData.shift &&
        t.slotNumber === modalData.slotNumber &&
        t.id !== editingSlotId
    );

    if (conflict) {
      const existingClass = classes.find(c => c.id === conflict.classGroupId);
      setFormError(`Já existe uma aula agendada neste horário para a turma: ${existingClass?.name || 'Desconhecida'}`);
      return;
    }

    if (editingSlotId) {
      // Edit existing
      setTimeSlots(prev =>
        prev.map(t =>
          t.id === editingSlotId
            ? {
                ...t,
                dayOfWeek: modalData.dayOfWeek,
                shift: modalData.shift,
                slotNumber: modalData.slotNumber,
                startTime: modalData.startTime,
                endTime: modalData.endTime,
                classGroupId: modalData.classGroupId,
                subjectId: modalData.subjectId,
              }
            : t
        )
      );
    } else {
      // Create new
      const newSlot: TimeSlot = {
        id: `slot-${Date.now()}`,
        dayOfWeek: modalData.dayOfWeek,
        shift: modalData.shift,
        slotNumber: modalData.slotNumber,
        startTime: modalData.startTime,
        endTime: modalData.endTime,
        classGroupId: modalData.classGroupId,
        subjectId: modalData.subjectId,
      };
      setTimeSlots(prev => [...prev, newSlot]);
    }

    setIsModalOpen(false);
    onDataChanged();
  };

  // Delete a scheduled slot
  const handleDeleteSlot = (id: string) => {
    if (confirm('Tem certeza que deseja desmarcar esta aula da grade?')) {
      setTimeSlots(prev => prev.filter(t => t.id !== id));
      setIsModalOpen(false);
      onDataChanged();
    }
  };

  // Copy entire schedule of one day to another day (Quick action helper)
  const [copySourceDay, setCopySourceDay] = useState<number | ''>('');
  const [copyTargetDay, setCopyTargetDay] = useState<number | ''>('');
  const [showCopyPanel, setShowCopyPanel] = useState<boolean>(false);

  const handleCopyDaySchedule = () => {
    if (copySourceDay === '' || copyTargetDay === '') {
      alert('Selecione os dias de origem e destino.');
      return;
    }
    if (copySourceDay === copyTargetDay) {
      alert('Os dias de origem e destino devem ser diferentes.');
      return;
    }

    const sourceSlots = timeSlots.filter(t => t.dayOfWeek === copySourceDay);
    if (sourceSlots.length === 0) {
      alert('O dia de origem não possui nenhuma aula cadastrada.');
      return;
    }

    if (confirm(`Isso copiará ${sourceSlots.length} aulas do dia de origem para o dia de destino. Aulas conflitantes no dia de destino serão ignoradas. Confirmar?`)) {
      const newSlots: TimeSlot[] = [];
      sourceSlots.forEach(src => {
        // check conflict on target day
        const hasConflict = timeSlots.some(
          t => t.dayOfWeek === copyTargetDay && t.shift === src.shift && t.slotNumber === src.slotNumber
        );
        if (!hasConflict) {
          newSlots.push({
            ...src,
            id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            dayOfWeek: copyTargetDay as number,
          });
        }
      });

      if (newSlots.length > 0) {
        setTimeSlots(prev => [...prev, ...newSlots]);
        onDataChanged();
        alert(`${newSlots.length} aulas copiadas com sucesso!`);
      } else {
        alert('Nenhuma aula copiada pois todos os horários do dia de destino já estavam ocupados.');
      }
      setShowCopyPanel(false);
    }
  };

  return (
    <div id="grade-aulas-container" className="space-y-6">
      {/* Upper Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Shift Filter buttons */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1 self-start md:self-auto">
          {(['Manhã', 'Tarde', 'Noite'] as const).map(shift => (
            <button
              key={shift}
              id={`shift-filter-${shift}`}
              onClick={() => setSelectedShift(shift)}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedShift === shift
                  ? 'bg-white text-indigo-600 font-bold shadow-xs border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {SHIFT_LABELS[shift]}
            </button>
          ))}
        </div>

        {/* Quick Utilities */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="toggle-saturday"
            onClick={() => setShowSaturday(prev => !prev)}
            className={`py-2 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showSaturday
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showSaturday ? 'Ocultar Sábado' : 'Mostrar Sábado'}
          </button>

          <button
            id="toggle-copy-panel"
            onClick={() => setShowCopyPanel(prev => !prev)}
            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Copy size={14} />
            <span>Duplicar Dia</span>
          </button>
        </div>
      </div>

      {/* Copy Day Dialog Panel */}
      <AnimatePresence>
        {showCopyPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <span className="text-sm font-semibold text-indigo-800">Copiar aulas de:</span>
                <select
                  value={copySourceDay}
                  onChange={e => setCopySourceDay(e.target.value === '' ? '' : Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full sm:w-40"
                >
                  <option value="">Selecione...</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>

                <MoveRight size={18} className="text-indigo-500 hidden sm:block" />

                <span className="text-sm font-semibold text-indigo-800">Para o dia:</span>
                <select
                  value={copyTargetDay}
                  onChange={e => setCopyTargetDay(e.target.value === '' ? '' : Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full sm:w-40"
                >
                  <option value="">Selecione...</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyDaySchedule}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Confirmar Cópia
                </button>
                <button
                  onClick={() => setShowCopyPanel(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TIMETABLE LAYOUT */}

      {/* Desktop view (visible on medium screens and up) */}
      <div id="desktop-grid" className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="w-28 py-4 px-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Horário
              </th>
              {filteredDays.map(day => (
                <th key={day.value} className="py-4 px-3 text-center text-sm font-bold text-slate-700">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slotRange.map(slotNum => {
              const preset = DEFAULT_TIME_PRESETS[selectedShift].find(p => p.slot === slotNum) || { start: '--:--', end: '--:--' };
              return (
                <tr key={slotNum} className="group hover:bg-slate-50/20 transition-all">
                  {/* Time column */}
                  <td className="py-5 px-3 font-mono border-r border-slate-100">
                    <span className="block text-sm font-bold text-slate-700">{slotNum}ª Aula</span>
                    <span className="block text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      {preset.start} - {preset.end}
                    </span>
                  </td>

                  {/* Days columns */}
                  {filteredDays.map(day => {
                    const scheduledSlot = findTimeSlot(day.value, selectedShift, slotNum);
                    const associatedClass = scheduledSlot ? classes.find(c => c.id === scheduledSlot.classGroupId) : null;
                    const associatedSchool = associatedClass ? schools.find(s => s.id === associatedClass.schoolId) : null;
                    const associatedSubject = scheduledSlot ? subjects.find(s => s.id === scheduledSlot.subjectId) : null;

                    const subjectPalette = associatedSubject ? getPaletteColor(associatedSubject.color) : COLOR_PALETTE[0];
                    const schoolPalette = associatedSchool ? getPaletteColor(associatedSchool.color) : COLOR_PALETTE[0];

                    return (
                      <td key={day.value} className="p-2 border-r border-slate-100 last:border-r-0 align-middle">
                        {scheduledSlot ? (
                          <div
                            onClick={() => handleEditClick(scheduledSlot)}
                            className={`group/card cursor-pointer p-3 rounded-2xl border ${subjectPalette.border} ${subjectPalette.lightBg} hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all text-left relative min-h-[105px] flex flex-col justify-between`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className={`text-xs font-bold ${subjectPalette.text} truncate max-w-[120px]`}>
                                  {associatedSubject?.name}
                                </span>
                                <span className="text-[10px] bg-white/80 px-1 py-0.5 rounded-sm border border-slate-150 text-slate-500 font-mono">
                                  {scheduledSlot.startTime}
                                </span>
                              </div>
                              <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                                {associatedClass?.name}
                              </h4>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-slate-100/35 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 truncate max-w-[110px] flex items-center gap-1 font-medium">
                                <span className={`w-1.5 h-1.5 rounded-full ${schoolPalette.bg}`} />
                                {associatedSchool?.name}
                              </span>
                              <span className="opacity-0 group-hover/card:opacity-100 text-[10px] text-indigo-600 font-bold flex items-center gap-0.5 transition-all">
                                Editar
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddClick(day.value, selectedShift, slotNum)}
                            className="w-full py-6 px-3 border border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50/20 transition-all cursor-pointer group/add gap-1 min-h-[105px]"
                          >
                            <Plus size={16} className="scale-100 group-hover/add:scale-110 transition-all" />
                            <span className="text-xs font-bold text-slate-400 group-hover/add:text-indigo-600">Livre</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view (visible on screens smaller than md) */}
      <div id="mobile-grid" className="block md:hidden space-y-4">
        {/* Day Selector Tabs for mobile */}
        <div className="flex items-center justify-between bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs gap-2">
          <button
            onClick={() => setSelectedDayMobile(prev => prev > 1 ? prev - 1 : 6)}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 text-center">
            <span className="text-sm font-extrabold text-slate-800">
              {DAYS_OF_WEEK.find(d => d.value === selectedDayMobile)?.label}
            </span>
          </div>

          <button
            onClick={() => setSelectedDayMobile(prev => prev < 6 ? prev + 1 : 1)}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Small quick tab dots */}
        <div className="flex justify-center gap-1.5 py-1">
          {filteredDays.map(d => (
            <button
              key={d.value}
              onClick={() => setSelectedDayMobile(d.value)}
              className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                selectedDayMobile === d.value
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>

        {/* Vertical list of slots for the chosen day on mobile */}
        <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          {slotRange.map(slotNum => {
            const scheduledSlot = findTimeSlot(selectedDayMobile, selectedShift, slotNum);
            const preset = DEFAULT_TIME_PRESETS[selectedShift].find(p => p.slot === slotNum) || { start: '--:--', end: '--:--' };
            
            const associatedClass = scheduledSlot ? classes.find(c => c.id === scheduledSlot.classGroupId) : null;
            const associatedSchool = associatedClass ? schools.find(s => s.id === associatedClass.schoolId) : null;
            const associatedSubject = scheduledSlot ? subjects.find(s => s.id === scheduledSlot.subjectId) : null;

            const subjectPalette = associatedSubject ? getPaletteColor(associatedSubject.color) : COLOR_PALETTE[0];
            const schoolPalette = associatedSchool ? getPaletteColor(associatedSchool.color) : COLOR_PALETTE[0];

            return (
              <div
                key={slotNum}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  scheduledSlot
                    ? `${subjectPalette.border} ${subjectPalette.lightBg}`
                    : 'border-slate-100 bg-slate-50/40'
                }`}
              >
                {/* Time Indicator */}
                <div className="w-16 flex-shrink-0 font-mono text-center border-r border-slate-150 pr-2">
                  <span className="block text-xs font-bold text-slate-700">{slotNum}ª Aula</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{preset.start}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {scheduledSlot ? (
                    <div onClick={() => handleEditClick(scheduledSlot)} className="cursor-pointer">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-extrabold ${subjectPalette.text}`}>
                          {associatedSubject?.name}
                        </span>
                        <span className="text-[9px] bg-white px-1 rounded border border-slate-100 text-slate-400">
                          {scheduledSlot.startTime} - {scheduledSlot.endTime}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5">
                        {associatedClass?.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <span className={`w-1.5 h-1.5 rounded-full ${schoolPalette.bg}`} />
                        {associatedSchool?.name}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddClick(selectedDayMobile, selectedShift, slotNum)}
                      className="w-full py-3 px-4 border border-dashed border-slate-200 hover:border-indigo-400 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/10 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold"
                    >
                      <Plus size={14} />
                      <span>Agendar Horário Vago</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SCHEDULE MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingSlotId ? 'Editar Aula Agendada' : 'Agendar Aula na Grade'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Calendar size={12} />
                    {DAYS_OF_WEEK.find(d => d.value === modalData.dayOfWeek)?.label} • {SHIFT_LABELS[modalData.shift]} • {modalData.slotNumber}ª Aula
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSaveSlot} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Grid controls to switch day/shift/slot inside modal if editing/adding */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Dia da Semana</label>
                    <select
                      value={modalData.dayOfWeek}
                      onChange={e => setModalData(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Turno</label>
                    <select
                      value={modalData.shift}
                      onChange={e => handleModalShiftChange(e.target.value as 'Manhã' | 'Tarde' | 'Noite')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Manhã">Matutino</option>
                      <option value="Tarde">Vespertino</option>
                      <option value="Noite">Noturno</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Nº Aula</label>
                    <select
                      value={modalData.slotNumber}
                      onChange={e => handleModalSlotNumberChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    >
                      {(modalData.shift === 'Noite' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]).map(num => (
                        <option key={num} value={num}>{num}ª Aula</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Início</label>
                    <input
                      type="text"
                      placeholder="07:30"
                      value={modalData.startTime}
                      onChange={e => setModalData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Fim</label>
                    <input
                      type="text"
                      placeholder="08:15"
                      value={modalData.endTime}
                      onChange={e => setModalData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-center font-mono"
                    />
                  </div>
                </div>

                {/* Turma / Escola Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Turma / Série *</label>
                  <select
                    value={modalData.classGroupId}
                    onChange={e => setModalData(prev => ({ ...prev, classGroupId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {classes.map(cls => {
                      const school = schools.find(s => s.id === cls.schoolId);
                      return (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({school ? school.name : 'Desconhecida'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Disciplina Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Matéria / Disciplina *</label>
                  <select
                    value={modalData.subjectId}
                    onChange={e => setModalData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {editingSlotId ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(editingSlotId)}
                      className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Excluir</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
