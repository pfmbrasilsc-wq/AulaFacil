import React, { useState } from 'react';
import { School, ClassGroup, Subject } from '../types';
import { COLOR_PALETTE, getPaletteColor } from '../utils/storage';
import { Plus, Trash2, Edit2, X, Check, School as SchoolIcon, GraduationCap, BookOpen, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CadastroGeralProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  classes: ClassGroup[];
  setClasses: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  onDataChanged: () => void;
}

export default function CadastroGeral({
  schools,
  setSchools,
  classes,
  setClasses,
  subjects,
  setSubjects,
  onDataChanged,
}: CadastroGeralProps) {
  // Tabs for sub-categories: Schools, Classes, Subjects
  const [activeTab, setActiveTab] = useState<'schools' | 'classes' | 'subjects'>('schools');

  // Form states
  const [schoolForm, setSchoolForm] = useState<{ id: string; name: string; color: string; location: string }>({
    id: '',
    name: '',
    color: 'Azul',
    location: '',
  });

  const [classForm, setClassForm] = useState<{ id: string; name: string; schoolId: string; shift: 'Manhã' | 'Tarde' | 'Noite' }>({
    id: '',
    name: '',
    schoolId: '',
    shift: 'Manhã',
  });

  const [subjectForm, setSubjectForm] = useState<{ id: string; name: string; color: string }>({
    id: '',
    name: '',
    color: 'Azul',
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Messages/Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handlers for School
  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) {
      setErrorMsg('O nome da escola é obrigatório.');
      return;
    }

    if (isEditing) {
      setSchools(prev => prev.map(s => s.id === schoolForm.id ? { ...s, name: schoolForm.name, color: schoolForm.color, location: schoolForm.location } : s));
    } else {
      const newSchool: School = {
        id: `sch-${Date.now()}`,
        name: schoolForm.name,
        color: schoolForm.color,
        location: schoolForm.location || undefined,
      };
      setSchools(prev => [...prev, newSchool]);
    }
    resetSchoolForm();
    onDataChanged();
  };

  const handleEditSchool = (school: School) => {
    setSchoolForm({
      id: school.id,
      name: school.name,
      color: school.color,
      location: school.location || '',
    });
    setIsEditing(true);
    setErrorMsg(null);
  };

  const handleDeleteSchool = (id: string) => {
    // Check if school has associated classes
    const hasClasses = classes.some(c => c.schoolId === id);
    if (hasClasses) {
      setErrorMsg('Não é possível excluir esta escola pois existem turmas vinculadas a ela.');
      return;
    }
    setSchools(prev => prev.filter(s => s.id !== id));
    setErrorMsg(null);
    onDataChanged();
  };

  const resetSchoolForm = () => {
    setSchoolForm({ id: '', name: '', color: 'Azul', location: '' });
    setIsEditing(false);
    setErrorMsg(null);
  };

  // Handlers for Class (Turma)
  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      setErrorMsg('O nome da turma é obrigatório.');
      return;
    }
    if (!classForm.schoolId) {
      setErrorMsg('Selecione uma escola para vincular a turma.');
      return;
    }

    if (isEditing) {
      setClasses(prev => prev.map(c => c.id === classForm.id ? { ...c, name: classForm.name, schoolId: classForm.schoolId, shift: classForm.shift } : c));
    } else {
      const newClass: ClassGroup = {
        id: `cls-${Date.now()}`,
        name: classForm.name,
        schoolId: classForm.schoolId,
        shift: classForm.shift,
      };
      setClasses(prev => [...prev, newClass]);
    }
    resetClassForm();
    onDataChanged();
  };

  const handleEditClass = (cls: ClassGroup) => {
    setClassForm({
      id: cls.id,
      name: cls.name,
      schoolId: cls.schoolId,
      shift: cls.shift,
    });
    setIsEditing(true);
    setErrorMsg(null);
  };

  const handleDeleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setErrorMsg(null);
    onDataChanged();
  };

  const resetClassForm = () => {
    setClassForm({ id: '', name: '', schoolId: schools[0]?.id || '', shift: 'Manhã' });
    setIsEditing(false);
    setErrorMsg(null);
  };

  // Handlers for Subject (Disciplina)
  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) {
      setErrorMsg('O nome da matéria/disciplina é obrigatório.');
      return;
    }

    if (isEditing) {
      setSubjects(prev => prev.map(s => s.id === subjectForm.id ? { ...s, name: subjectForm.name, color: subjectForm.color } : s));
    } else {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        name: subjectForm.name,
        color: subjectForm.color,
      };
      setSubjects(prev => [...prev, newSubject]);
    }
    resetSubjectForm();
    onDataChanged();
  };

  const handleEditSubject = (sub: Subject) => {
    setSubjectForm({
      id: sub.id,
      name: sub.name,
      color: sub.color,
    });
    setIsEditing(true);
    setErrorMsg(null);
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setErrorMsg(null);
    onDataChanged();
  };

  const resetSubjectForm = () => {
    setSubjectForm({ id: '', name: '', color: 'Azul' });
    setIsEditing(false);
    setErrorMsg(null);
  };

  // Auto set school if blank in class form when switching tab or adding first school
  React.useEffect(() => {
    if (!classForm.schoolId && schools.length > 0) {
      setClassForm(prev => ({ ...prev, schoolId: schools[0].id }));
    }
  }, [schools, classForm.schoolId]);

  return (
    <div id="cadastro-geral-container" className="space-y-6">
      {/* Tab Selector */}
      <div className="flex border border-slate-200 bg-white p-1.5 rounded-3xl shadow-2xs gap-1 max-w-lg mx-auto md:max-w-none">
        <button
          id="tab-schools"
          onClick={() => { setActiveTab('schools'); resetSchoolForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'schools'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <SchoolIcon size={18} />
          <span>Escolas</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${activeTab === 'schools' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {schools.length}
          </span>
        </button>
        <button
          id="tab-classes"
          onClick={() => { setActiveTab('classes'); resetClassForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <GraduationCap size={18} />
          <span>Turmas</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${activeTab === 'classes' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {classes.length}
          </span>
        </button>
        <button
          id="tab-subjects"
          onClick={() => { setActiveTab('subjects'); resetSubjectForm(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen size={18} />
          <span>Disciplinas</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${activeTab === 'subjects' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {subjects.length}
          </span>
        </button>
      </div>

      {/* Error Feedback */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100 flex items-center justify-between gap-2 shadow-xs"
          >
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM COLUMN (Left or top depending on screen) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-lg font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            {activeTab === 'schools' && <SchoolIcon className="text-indigo-600" size={20} />}
            {activeTab === 'classes' && <GraduationCap className="text-indigo-600" size={20} />}
            {activeTab === 'subjects' && <BookOpen className="text-indigo-600" size={20} />}
            <span>{isEditing ? 'Editar' : 'Cadastrar'} {activeTab === 'schools' ? 'Escola' : activeTab === 'classes' ? 'Turma' : 'Disciplina'}</span>
          </h3>

          {/* TAB 1: SCHOOL FORM */}
          {activeTab === 'schools' && (
            <form onSubmit={handleSchoolSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nome da Escola *</label>
                <input
                  type="text"
                  placeholder="Ex: Escola Estadual Castro Alves"
                  value={schoolForm.name}
                  onChange={e => setSchoolForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-hidden transition-all text-sm placeholder-slate-400 font-sans font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Localização / Unidade</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: Bairro Centro ou Av. Paulista"
                    value={schoolForm.location}
                    onChange={e => setSchoolForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-hidden transition-all text-sm placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Identificador Visual / Cor</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSchoolForm(prev => ({ ...prev, color: color.name }))}
                      className={`h-10 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        schoolForm.color === color.name
                          ? 'border-slate-900 ring-2 ring-offset-2 ring-indigo-200 scale-105'
                          : 'border-transparent hover:scale-105'
                      } ${color.bg}`}
                      title={color.name}
                    >
                      {schoolForm.color === color.name && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isEditing ? <Check size={18} /> : <Plus size={18} />}
                  <span>{isEditing ? 'Salvar Alterações' : 'Adicionar Escola'}</span>
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetSchoolForm}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-200"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}

          {/* TAB 2: CLASS FORM */}
          {activeTab === 'classes' && (
            <form onSubmit={handleClassSubmit} className="space-y-4">
              {schools.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Cadastre pelo menos uma <span className="font-bold text-indigo-600">Escola</span> antes de criar uma turma.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nome da Turma / Série *</label>
                    <input
                      type="text"
                      placeholder="Ex: 3º Ano EM - A, 7ª Série B"
                      value={classForm.name}
                      onChange={e => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-hidden transition-all text-sm placeholder-slate-400 font-sans font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Vincular à Escola *</label>
                    <select
                      value={classForm.schoolId}
                      onChange={e => setClassForm(prev => ({ ...prev, schoolId: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-hidden transition-all text-sm text-slate-700 font-medium cursor-pointer"
                    >
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>
                          {sch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Turno Padrão</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Manhã', 'Tarde', 'Noite'] as const).map(shift => (
                        <button
                          key={shift}
                          type="button"
                          onClick={() => setClassForm(prev => ({ ...prev, shift }))}
                          className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            classForm.shift === shift
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-2xs font-bold'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {shift}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isEditing ? <Check size={18} /> : <Plus size={18} />}
                      <span>{isEditing ? 'Salvar Alterações' : 'Adicionar Turma'}</span>
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={resetClassForm}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-200"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          )}

          {/* TAB 3: SUBJECT FORM */}
          {activeTab === 'subjects' && (
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nome da Matéria / Disciplina *</label>
                <input
                  type="text"
                  placeholder="Ex: Matemática, Física, História"
                  value={subjectForm.name}
                  onChange={e => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-hidden transition-all text-sm placeholder-slate-400 font-sans font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Cor de Identificação</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSubjectForm(prev => ({ ...prev, color: color.name }))}
                      className={`h-10 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        subjectForm.color === color.name
                          ? 'border-slate-900 ring-2 ring-offset-2 ring-indigo-200 scale-105'
                          : 'border-transparent hover:scale-105'
                      } ${color.bg}`}
                      title={color.name}
                    >
                      {subjectForm.color === color.name && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isEditing ? <Check size={18} /> : <Plus size={18} />}
                  <span>{isEditing ? 'Salvar Alterações' : 'Adicionar Disciplina'}</span>
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetSubjectForm}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-200"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* LIST COLUMN (Right or bottom depending on screen) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs min-h-[400px]">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
            <span>Listagem Cadastrada</span>
            <span className="text-xs font-normal text-slate-400 font-mono">
              ({activeTab === 'schools' ? 'Escolas' : activeTab === 'classes' ? 'Turmas' : 'Disciplinas'})
            </span>
          </h3>

          {/* LIST: SCHOOLS */}
          {activeTab === 'schools' && (
            <div className="space-y-3">
              {schools.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Nenhuma escola cadastrada ainda. Use o formulário ao lado para começar!
                </div>
              ) : (
                schools.map(sch => {
                  const palette = getPaletteColor(sch.color);
                  const linkedClassesCount = classes.filter(c => c.schoolId === sch.id).length;
                  return (
                    <div
                      key={sch.id}
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-12 rounded-md ${palette.bg}`} />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{sch.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                            {sch.location && (
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin size={12} className="text-indigo-600" />
                                {sch.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px]">
                              {linkedClassesCount} {linkedClassesCount === 1 ? 'turma' : 'turmas'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditSchool(sch)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Editar Escola"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSchool(sch.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Excluir Escola"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST: CLASSES */}
          {activeTab === 'classes' && (
            <div className="space-y-3">
              {classes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Nenhuma turma cadastrada ainda. Use o formulário ao lado para começar!
                </div>
              ) : (
                classes.map(cls => {
                  const linkedSchool = schools.find(s => s.id === cls.schoolId);
                  const schPalette = linkedSchool ? getPaletteColor(linkedSchool.color) : COLOR_PALETTE[0];
                  return (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-12 rounded-md ${schPalette.bg}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">{cls.name}</h4>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                              {cls.shift}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                            <SchoolIcon size={12} className="text-indigo-600" />
                            {linkedSchool?.name || 'Escola desconhecida'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditClass(cls)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Editar Turma"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Excluir Turma"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-3">
              {subjects.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Nenhuma disciplina cadastrada ainda. Use o formulário ao lado para começar!
                </div>
              ) : (
                subjects.map(sub => {
                  const palette = getPaletteColor(sub.color);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-12 rounded-md ${palette.bg}`} />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{sub.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                            <Tag size={12} className={palette.text} />
                            Cor: {sub.color}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditSubject(sub)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Editar Disciplina"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Excluir Disciplina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
