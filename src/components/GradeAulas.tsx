import React, { useState } from 'react';
import { School, ClassGroup, Subject, TimeSlot } from '../types';
import { COLOR_PALETTE, getPaletteColor } from '../utils/storage';
import { Plus, Trash2, Edit2, X, Clock, Calendar, Check, AlertCircle, Copy, MoveRight } from 'lucide-react';
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
      alert('Por favor, cadastre primeiro as turmas e os componentes curriculares na aba de "Cadastros"!');
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
      setFormError('Selecione um componente curricular.');
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

  return (
    <div id="grade-aulas-container" className="space-y-4">
      {/* Shift/Turn tabs above the timetable */}
      <div className="flex border-b border-slate-200 gap-1">
        {(['Manhã', 'Tarde', 'Noite'] as const).map(shift => (
          <button
            key={shift}
            id={`shift-tab-${shift}`}
            onClick={() => setSelectedShift(shift)}
            className={`py-2 px-5 sm:py-2.5 sm:px-7 text-xs sm:text-sm font-bold border-b-2 -mb-[2px] transition-all cursor-pointer ${
              selectedShift === shift
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {SHIFT_LABELS[shift]}
          </button>
        ))}
      </div>

      {/* UNIFIED TIMETABLE LAYOUT - Fits perfectly in a single screen */}
      <div id="unified-timetable-grid" className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden w-full">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="w-12 sm:w-28 py-2 px-1 sm:py-3 sm:px-2 text-center sm:text-left text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Horário
              </th>
              {filteredDays.map(day => (
                <th key={day.value} className="py-2 px-1 sm:py-3 sm:px-2 text-center text-xs sm:text-sm font-extrabold text-slate-700">
                  <span className="hidden sm:inline">{day.label}</span>
                  <span className="inline sm:hidden">{day.short}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slotRange.map(slotNum => {
              const preset = DEFAULT_TIME_PRESETS[selectedShift].find(p => p.slot === slotNum) || { start: '--:--', end: '--:--' };
              return (
                <tr key={slotNum} className="group hover:bg-slate-50/10 transition-all">
                  {/* Time column */}
                  <td className="py-1.5 px-0.5 sm:py-3 sm:px-2 font-mono border-r border-slate-100 text-center sm:text-left">
                    <span className="block text-[10px] sm:text-sm font-bold text-slate-700 leading-tight">{slotNum}ª Aula</span>
                    <span className="block text-[8px] sm:text-xs text-slate-400 mt-0.5 font-semibold leading-tight">
                      {preset.start}
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
                      <td key={day.value} className="p-0.5 sm:p-1.5 border-r border-slate-100 last:border-r-0 align-middle">
                        {scheduledSlot ? (
                          <div
                            onClick={() => handleEditClick(scheduledSlot)}
                            className={`group/card cursor-pointer p-1 sm:p-2.5 rounded-lg sm:rounded-xl border ${subjectPalette.border} ${subjectPalette.lightBg} hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all text-left relative min-h-[46px] sm:min-h-[85px] flex flex-col justify-between`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className={`text-[8px] sm:text-[10px] font-bold ${subjectPalette.text} truncate max-w-[42px] sm:max-w-[120px]`}>
                                  {associatedSubject?.name}
                                </span>
                                <span className="hidden sm:inline text-[9px] bg-white/80 px-1 py-0.5 rounded-sm border border-slate-150 text-slate-500 font-mono">
                                  {scheduledSlot.startTime}
                                </span>
                              </div>
                              <h4 className="text-[9px] sm:text-xs font-extrabold text-slate-800 leading-tight truncate sm:whitespace-normal sm:line-clamp-2">
                                {associatedClass?.name}
                              </h4>
                            </div>
                            
                            <div className="mt-0.5 pt-0.5 border-t border-slate-100/35 flex items-center justify-between min-w-0">
                              <span className="text-[7.5px] sm:text-[10px] text-slate-500 truncate max-w-[42px] sm:max-w-[110px] flex items-center gap-0.5 sm:gap-1 font-medium">
                                <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full flex-shrink-0 ${schoolPalette.bg}`} />
                                <span className="truncate">{associatedSchool?.name}</span>
                              </span>
                              <span className="hidden lg:inline opacity-0 group-hover/card:opacity-100 text-[9px] text-indigo-600 font-bold transition-all">
                                Editar
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddClick(day.value, selectedShift, slotNum)}
                            className="w-full py-2 sm:py-5 px-0.5 sm:px-2 border border-dashed border-slate-200 hover:border-indigo-400 rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50/25 transition-all cursor-pointer group/add gap-0.5 min-h-[46px] sm:min-h-[85px]"
                          >
                            <Plus size={10} className="scale-100 group-hover/add:scale-110 transition-all text-slate-400 sm:text-slate-300" />
                            <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 group-hover/add:text-indigo-600">Livre</span>
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

        {/* Footer with Saturday checkbox */}
        <div className="flex items-center justify-between bg-slate-50/50 px-4 py-3 border-t border-slate-100 text-slate-500 text-xs mt-auto">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSaturday}
              onChange={e => setShowSaturday(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-semibold text-slate-700">Mostrar Sábado na grade</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Grade de Aulas Unificada</span>
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

                {/* Componente Curricular Selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Componente Curricular *</label>
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
