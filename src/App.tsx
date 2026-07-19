import React, { useState, useEffect, useRef } from 'react';
import { School, ClassGroup, Subject, TimeSlot, Activity, ClassJournal } from './types';
import { initializeAppStorage, loadFromStorage, saveToStorage } from './utils/storage';
import {
  isSupabaseConfigured,
  pullAllFromSupabase,
  pushAllToSupabase,
  upsertToSupabase,
  deleteFromSupabase,
  clearSupabaseTable
} from './utils/supabase';
import Dashboard from './components/Dashboard';
import GradeAulas from './components/GradeAulas';
import CadastroGeral from './components/CadastroGeral';
import RegistroAtividades from './components/RegistroAtividades';
import BackupConfig from './components/BackupConfig';
import {
  LayoutDashboard,
  CalendarRange,
  GraduationCap,
  ClipboardList,
  Database,
  Sparkles,
  Menu,
  X,
  Cloud,
  CloudOff,
  CloudLightning,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Initialize App Local Storage values if empty on boot
  useEffect(() => {
    initializeAppStorage();
  }, []);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Main collections states loaded from Local Storage
  const [schools, setSchools] = useState<School[]>(() => loadFromStorage<School[]>('schools', []));
  const [classes, setClasses] = useState<ClassGroup[]>(() => loadFromStorage<ClassGroup[]>('classes', []));
  const [subjects, setSubjects] = useState<Subject[]>(() => loadFromStorage<Subject[]>('subjects', []));
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const loaded = loadFromStorage<TimeSlot[]>('time_slots', []);
    let changed = false;
    const migrated = loaded.map(slot => {
      let current = { ...slot };
      if (current.shift === 'Manhã' && current.slotNumber === 3 && current.startTime === '09:15' && current.endTime === '10:00') {
        changed = true;
        current.startTime = '09:00';
        current.endTime = '09:45';
      }
      if (current.shift === 'Tarde') {
        if (current.slotNumber === 5 && current.startTime === '16:45' && current.endTime === '17:30') {
          changed = true;
          current.startTime = '16:30';
          current.endTime = '17:15';
        } else if (current.slotNumber === 6 && current.startTime === '17:30' && current.endTime === '18:15') {
          changed = true;
          current.startTime = '17:15';
          current.endTime = '18:00';
        }
      }
      if (current.shift === 'Noite') {
        if (current.slotNumber === 1 && current.startTime !== '18:30') {
          changed = true;
          current.startTime = '18:30';
          current.endTime = '19:10';
        } else if (current.slotNumber === 2 && current.startTime !== '19:10') {
          changed = true;
          current.startTime = '19:10';
          current.endTime = '19:50';
        } else if (current.slotNumber === 3 && current.startTime !== '20:00') {
          changed = true;
          current.startTime = '20:00';
          current.endTime = '20:40';
        } else if (current.slotNumber === 4 && current.startTime !== '20:40') {
          changed = true;
          current.startTime = '20:40';
          current.endTime = '21:20';
        } else if (current.slotNumber === 5 && current.startTime !== '21:20') {
          changed = true;
          current.startTime = '21:20';
          current.endTime = '22:00';
        }
      }
      return current;
    }).filter(slot => {
      if (slot.shift === 'Noite' && slot.slotNumber > 5) {
        changed = true;
        return false;
      }
      return true;
    });
    if (changed) {
      saveToStorage('time_slots', migrated);
    }
    return migrated;
  });
  const [activities, setActivities] = useState<Activity[]>(() => loadFromStorage<Activity[]>('activities', []));
  const [journals, setJournals] = useState<ClassJournal[]>(() => loadFromStorage<ClassJournal[]>('journals', []));

  // Previous states refs to detect deleted elements
  const prevSchoolsRef = useRef<School[]>(schools);
  const prevClassesRef = useRef<ClassGroup[]>(classes);
  const prevSubjectsRef = useRef<Subject[]>(subjects);
  const prevTimeSlotsRef = useRef<TimeSlot[]>(timeSlots);
  const prevActivitiesRef = useRef<Activity[]>(activities);
  const prevJournalsRef = useRef<ClassJournal[]>(journals);

  // Synchronize with Supabase on mount if configured
  useEffect(() => {
    async function initSync() {
      if (!isSupabaseConfigured) {
        setSyncStatus('idle');
        return;
      }
      setSyncStatus('syncing');
      setSyncError(null);
      try {
        const cloudData = await pullAllFromSupabase();
        if (cloudData) {
          const hasCloudData =
            cloudData.schools.length > 0 ||
            cloudData.classes.length > 0 ||
            cloudData.subjects.length > 0 ||
            cloudData.timeSlots.length > 0 ||
            cloudData.activities.length > 0 ||
            cloudData.journals.length > 0;

          if (hasCloudData) {
            // Setup local states with cloud data
            setSchools(cloudData.schools);
            setClasses(cloudData.classes);
            setSubjects(cloudData.subjects);
            setTimeSlots(cloudData.timeSlots);
            setActivities(cloudData.activities);
            setJournals(cloudData.journals);

            // Sync refs as well
            prevSchoolsRef.current = cloudData.schools;
            prevClassesRef.current = cloudData.classes;
            prevSubjectsRef.current = cloudData.subjects;
            prevTimeSlotsRef.current = cloudData.timeSlots;
            prevActivitiesRef.current = cloudData.activities;
            prevJournalsRef.current = cloudData.journals;

            setSyncStatus('success');
          } else {
            // Cloud is empty, push local data to cloud
            try {
              const success = await pushAllToSupabase({
                schools,
                classes,
                subjects,
                timeSlots,
                activities,
                journals,
              });
              setSyncStatus(success ? 'success' : 'error');
              if (!success) {
                setSyncError('Erro geral ao enviar dados locais para a nuvem.');
              }
            } catch (pushErr: any) {
              setSyncError(pushErr.message || 'Erro ao enviar dados para a nuvem.');
              setSyncStatus('error');
            }
          }
        } else {
          setSyncStatus('error');
          setSyncError('Não foi possível carregar os dados da nuvem.');
        }
      } catch (err: any) {
        console.warn('Erro ao sincronizar com Supabase:', err);
        setSyncError(err.message || 'Erro de conexão com o Supabase.');
        setSyncStatus('error');
      }
    }
    initSync();
  }, []);

  // Navigation tab state
  const [currentView, setCurrentView] = useState<'dashboard' | 'timetable' | 'activities' | 'config' | 'backup'>('dashboard');

  // Mobile drawer/menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistence triggers
  const handleDataChanged = () => {
    // A simple trigger function just in case we need direct force state updates
  };

  // Synchronize changes to local storage and Supabase whenever states change
  useEffect(() => {
    saveToStorage('schools', schools);
    if (isSupabaseConfigured && syncStatus === 'success') {
      const deleted = prevSchoolsRef.current.filter(p => !schools.some(s => s.id === p.id));
      deleted.forEach(item => deleteFromSupabase('schools', item.id));
      if (schools.length > 0) upsertToSupabase('schools', schools);
    }
    prevSchoolsRef.current = schools;
  }, [schools, syncStatus]);

  useEffect(() => {
    saveToStorage('classes', classes);
    if (isSupabaseConfigured && syncStatus === 'success') {
      const deleted = prevClassesRef.current.filter(p => !classes.some(c => c.id === p.id));
      deleted.forEach(item => deleteFromSupabase('classes', item.id));
      if (classes.length > 0) upsertToSupabase('classes', classes);
    }
    prevClassesRef.current = classes;
  }, [classes, syncStatus]);

  useEffect(() => {
    saveToStorage('subjects', subjects);
    if (isSupabaseConfigured && syncStatus === 'success') {
      const deleted = prevSubjectsRef.current.filter(p => !subjects.some(s => s.id === p.id));
      deleted.forEach(item => deleteFromSupabase('subjects', item.id));
      if (subjects.length > 0) upsertToSupabase('subjects', subjects);
    }
    prevSubjectsRef.current = subjects;
  }, [subjects, syncStatus]);

  useEffect(() => {
    saveToStorage('time_slots', timeSlots);
    if (isSupabaseConfigured && syncStatus === 'success') {
      const deleted = prevTimeSlotsRef.current.filter(p => !timeSlots.some(t => t.id === p.id));
      deleted.forEach(item => deleteFromSupabase('time_slots', item.id));
      if (timeSlots.length > 0) upsertToSupabase('time_slots', timeSlots);
    }
    prevTimeSlotsRef.current = timeSlots;
  }, [timeSlots, syncStatus]);

  useEffect(() => {
    saveToStorage('activities', activities);
    if (isSupabaseConfigured && syncStatus === 'success') {
      const deleted = prevActivitiesRef.current.filter(p => !activities.some(a => a.id === p.id));
      deleted.forEach(item => deleteFromSupabase('activities', item.id));
      if (activities.length > 0) upsertToSupabase('activities', activities);
    }
    prevActivitiesRef.current = activities;
  }, [activities, syncStatus]);

  useEffect(() => {
    saveToStorage('journals', journals);
    if (isSupabaseConfigured && syncStatus === 'success') {
      const deleted = prevJournalsRef.current.filter(p => !journals.some(j => j.id === p.id));
      deleted.forEach(item => deleteFromSupabase('journals', item.id));
      if (journals.length > 0) upsertToSupabase('journals', journals);
    }
    prevJournalsRef.current = journals;
  }, [journals, syncStatus]);

  // Handle manual complete sync
  const handleForceSync = async (direction: 'push' | 'pull') => {
    if (!isSupabaseConfigured) return false;
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      if (direction === 'push') {
        const success = await pushAllToSupabase({
          schools,
          classes,
          subjects,
          timeSlots,
          activities,
          journals,
        });
        setSyncStatus(success ? 'success' : 'error');
        if (!success) {
          setSyncError('Erro geral ao enviar dados locais para a nuvem.');
        }
        return success;
      } else {
        const cloudData = await pullAllFromSupabase();
        if (cloudData) {
          setSchools(cloudData.schools);
          setClasses(cloudData.classes);
          setSubjects(cloudData.subjects);
          setTimeSlots(cloudData.timeSlots);
          setActivities(cloudData.activities);
          setJournals(cloudData.journals);
          setSyncStatus('success');
          return true;
        } else {
          setSyncStatus('error');
          setSyncError('Não foi possível carregar os dados da nuvem.');
          return false;
        }
      }
    } catch (err: any) {
      console.warn(err);
      setSyncError(err.message || 'Erro de conexão/sincronização com o Supabase.');
      setSyncStatus('error');
      return false;
    }
  };

  // Handle a complete data reset to original demo mock data
  const handleResetData = async () => {
    localStorage.removeItem('pedagogical_planner_schools');
    localStorage.removeItem('pedagogical_planner_classes');
    localStorage.removeItem('pedagogical_planner_subjects');
    localStorage.removeItem('pedagogical_planner_time_slots');
    localStorage.removeItem('pedagogical_planner_activities');
    localStorage.removeItem('pedagogical_planner_journals');
    
    initializeAppStorage();

    const defSchools = loadFromStorage<School[]>('schools', []);
    const defClasses = loadFromStorage<ClassGroup[]>('classes', []);
    const defSubjects = loadFromStorage<Subject[]>('subjects', []);
    const defTimeSlots = loadFromStorage<TimeSlot[]>('time_slots', []);
    const defActivities = loadFromStorage<Activity[]>('activities', []);
    const defJournals = loadFromStorage<ClassJournal[]>('journals', []);

    setSchools(defSchools);
    setClasses(defClasses);
    setSubjects(defSubjects);
    setTimeSlots(defTimeSlots);
    setActivities(defActivities);
    setJournals(defJournals);

    if (isSupabaseConfigured) {
      setSyncStatus('syncing');
      try {
        await Promise.all([
          clearSupabaseTable('schools'),
          clearSupabaseTable('classes'),
          clearSupabaseTable('subjects'),
          clearSupabaseTable('time_slots'),
          clearSupabaseTable('activities'),
          clearSupabaseTable('journals'),
        ]);
        const success = await pushAllToSupabase({
          schools: defSchools,
          classes: defClasses,
          subjects: defSubjects,
          timeSlots: defTimeSlots,
          activities: defActivities,
          journals: defJournals,
        });
        setSyncStatus(success ? 'success' : 'error');
      } catch (err) {
        console.error(err);
        setSyncStatus('error');
      }
    }
  };

  // Handle custom data file imports
  const handleImportData = async (newData: {
    schools: School[];
    classes: ClassGroup[];
    subjects: Subject[];
    timeSlots: TimeSlot[];
    activities: Activity[];
    journals: ClassJournal[];
  }) => {
    setSchools(newData.schools);
    setClasses(newData.classes);
    setSubjects(newData.subjects);
    setTimeSlots(newData.timeSlots);
    setActivities(newData.activities);
    setJournals(newData.journals);

    if (isSupabaseConfigured) {
      setSyncStatus('syncing');
      try {
        await Promise.all([
          clearSupabaseTable('schools'),
          clearSupabaseTable('classes'),
          clearSupabaseTable('subjects'),
          clearSupabaseTable('time_slots'),
          clearSupabaseTable('activities'),
          clearSupabaseTable('journals'),
        ]);
        const success = await pushAllToSupabase(newData);
        setSyncStatus(success ? 'success' : 'error');
      } catch (err) {
        console.error(err);
        setSyncStatus('error');
      }
    }
  };


  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'timetable', label: 'Grade de Aulas', icon: CalendarRange },
    { id: 'activities', label: 'Atividades & Diário', icon: ClipboardList },
    { id: 'config', label: 'Escolas & Turmas', icon: GraduationCap },
    { id: 'backup', label: 'Backup & Configs', icon: Database },
  ] as const;

  return (
    <div id="app-root-layout" className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900 antialiased font-sans">
      
      {/* SIDEBAR: Visible on desktop */}
      <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 flex-shrink-0 h-screen sticky top-0">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-100">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight block">Planejador</span>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider font-mono">Pedagógico</span>
            </div>
          </div>

          {/* Cloud Sync Status Badge */}
          <div className="mt-1">
            {!isSupabaseConfigured ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-semibold text-slate-500 border border-slate-200/40">
                <CloudOff size={10} className="text-slate-400" />
                <span>Modo Local</span>
              </div>
            ) : syncStatus === 'syncing' ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 rounded-full text-[10px] font-semibold text-blue-600 border border-blue-100 animate-pulse">
                <RefreshCw size={10} className="text-blue-500 animate-spin" />
                <span>Sincronizando...</span>
              </div>
            ) : syncStatus === 'success' ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 rounded-full text-[10px] font-semibold text-emerald-600 border border-emerald-100">
                <Cloud size={10} className="text-emerald-500" />
                <span>Nuvem Ativa</span>
              </div>
            ) : (
              <button
                onClick={() => handleForceSync('pull')}
                title="Clique para tentar sincronizar novamente"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 rounded-full text-[10px] font-semibold text-rose-600 border border-rose-100 cursor-pointer transition-all active:scale-95"
              >
                <CloudLightning size={10} className="text-rose-500 animate-pulse" />
                <span>Erro de Sincronia</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-100 m-4 bg-slate-50/50 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Suas Estatísticas</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-[10px] text-slate-400">Escolas</span>
              <span className="block text-sm font-extrabold text-slate-700">{schools.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Turmas</span>
              <span className="block text-sm font-extrabold text-slate-700">{classes.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER: Top bar on mobile */}
      <header id="mobile-header" className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-xs tracking-tight">Planejador</span>
              
              {!isSupabaseConfigured ? (
                <span className="inline-block w-2 h-2 rounded-full bg-slate-300" title="Modo Local" />
              ) : syncStatus === 'syncing' ? (
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Sincronizando..." />
              ) : syncStatus === 'success' ? (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Nuvem Ativa" />
              ) : (
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" title="Erro de Sincronia" />
              )}
            </div>
            <span className="text-[8px] text-indigo-600 font-bold uppercase tracking-wider font-mono block">Pedagógico</span>
          </div>
        </div>

        <button
          id="btn-mobile-menu"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE DRAWER: Dropdown menu on mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden z-30 relative"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`mobile-nav-${item.id}`}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER: Scrollable content container */}
      <main id="main-content" className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 md:p-10 max-w-7xl mx-auto w-full">
        {isSupabaseConfigured && syncStatus === 'error' && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-800 text-xs shadow-xs">
            <div className="flex items-start gap-3">
              <CloudLightning className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <span className="font-extrabold block text-rose-900">Erro de Sincronização Cloud</span>
                <span className="font-medium text-rose-600 block mt-0.5">
                  {syncError || 'Não foi possível se conectar ou sincronizar os dados com o Supabase.'}
                </span>
              </div>
            </div>
            {currentView !== 'backup' && (
              <button
                onClick={() => setCurrentView('backup')}
                className="flex-shrink-0 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer text-[11px] self-start sm:self-center"
              >
                Como Corrigir / Configurar
              </button>
            )}
          </div>
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            schools={schools}
            classes={classes}
            subjects={subjects}
            timeSlots={timeSlots}
            activities={activities}
            setActivities={setActivities}
            journals={journals}
            setView={setCurrentView}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentView === 'timetable' && (
          <GradeAulas
            schools={schools}
            classes={classes}
            subjects={subjects}
            timeSlots={timeSlots}
            setTimeSlots={setTimeSlots}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentView === 'activities' && (
          <RegistroAtividades
            schools={schools}
            classes={classes}
            subjects={subjects}
            timeSlots={timeSlots}
            activities={activities}
            setActivities={setActivities}
            journals={journals}
            setJournals={setJournals}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentView === 'config' && (
          <CadastroGeral
            schools={schools}
            setSchools={setSchools}
            classes={classes}
            setClasses={setClasses}
            subjects={subjects}
            setSubjects={setSubjects}
            onDataChanged={handleDataChanged}
          />
        )}

        {currentView === 'backup' && (
          <BackupConfig
            schools={schools}
            classes={classes}
            subjects={subjects}
            timeSlots={timeSlots}
            activities={activities}
            journals={journals}
            onResetData={handleResetData}
            onImportData={handleImportData}
            syncStatus={syncStatus}
            onForceSync={handleForceSync}
          />
        )}
      </main>
    </div>
  );
}

