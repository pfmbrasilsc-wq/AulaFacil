import React, { useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  FileJson,
  Info,
  Cloud,
  CloudOff,
  Copy,
  Check,
  RefreshCw,
  Database,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { initializeAppStorage, saveToStorage } from '../utils/storage';
import { School, ClassGroup, Subject, TimeSlot, Activity, ClassJournal } from '../types';
import { isSupabaseConfigured } from '../utils/supabase';

interface BackupConfigProps {
  schools: School[];
  classes: ClassGroup[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  activities: Activity[];
  journals: ClassJournal[];
  onResetData: () => void;
  onImportData: (data: {
    schools: School[];
    classes: ClassGroup[];
    subjects: Subject[];
    timeSlots: TimeSlot[];
    activities: Activity[];
    journals: ClassJournal[];
  }) => void;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  onForceSync?: (direction: 'push' | 'pull') => Promise<boolean>;
}

export default function BackupConfig({
  schools,
  classes,
  subjects,
  timeSlots,
  activities,
  journals,
  onResetData,
  onImportData,
  syncStatus = 'idle',
  onForceSync,
}: BackupConfigProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // States to manage custom Supabase credentials from local storage
  const [inputUrl, setInputUrl] = useState(() => localStorage.getItem('pedagogical_planner_supabase_url') || '');
  const [inputKey, setInputKey] = useState(() => localStorage.getItem('pedagogical_planner_supabase_anon_key') || '');

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      showError('Por favor, preencha a URL e a Chave Anon do Supabase.');
      return;
    }
    try {
      localStorage.setItem('pedagogical_planner_supabase_url', inputUrl.trim());
      localStorage.setItem('pedagogical_planner_supabase_anon_key', inputKey.trim());
      showSuccess('Configurações de nuvem salvas com sucesso! Reiniciando aplicativo para conectar...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showError('Erro ao salvar as configurações.');
    }
  };

  const handleDisconnectSupabase = () => {
    if (confirm('Deseja realmente desativar a sincronização na nuvem e voltar ao Modo 100% Local? Seus dados locais atuais serão preservados no aparelho.')) {
      try {
        localStorage.removeItem('pedagogical_planner_supabase_url');
        localStorage.removeItem('pedagogical_planner_supabase_anon_key');
        showSuccess('Sincronização em nuvem desativada. Reiniciando em Modo Local...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        showError('Erro ao desconectar.');
      }
    }
  };

  const sqlScript = `-- SCRIPT DE RECRIAÇÃO TOTAL (OPCIONAL: Limpa todas as tabelas antigas antes)
-- Se você quiser resetar tudo para corrigir erros, remova os "--" das linhas abaixo:
-- drop table if exists public.schools cascade;
-- drop table if exists public.classes cascade;
-- drop table if exists public.subjects cascade;
-- drop table if exists public.time_slots cascade;
-- drop table if exists public.activities cascade;
-- drop table if exists public.journals cascade;

-- Crie as tabelas no seu editor SQL do Supabase:

create table if not exists public.schools (
  id text primary key,
  name text not null,
  color text not null,
  location text
);

create table if not exists public.classes (
  id text primary key,
  name text not null,
  "schoolId" text not null,
  shift text not null
);

create table if not exists public.subjects (
  id text primary key,
  name text not null,
  color text not null
);

create table if not exists public.time_slots (
  id text primary key,
  "dayOfWeek" integer not null,
  shift text not null,
  "slotNumber" integer not null,
  "startTime" text not null,
  "endTime" text not null,
  "classGroupId" text not null,
  "subjectId" text not null
);

create table if not exists public.activities (
  id text primary key,
  type text not null,
  title text not null,
  description text,
  "dueDate" text not null,
  "classGroupId" text not null,
  "classGroupIds" text[],
  "subjectId" text not null,
  completed boolean default false not null,
  priority text not null
);

create table if not exists public.journals (
  id text primary key,
  date text not null,
  "timeSlotId" text not null,
  content text not null,
  notes text
);

-- Ativar Row Level Security (RLS)
alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.time_slots enable row level security;
alter table public.activities enable row level security;
alter table public.journals enable row level security;

-- Criar políticas de acesso público simples
create policy "Leitura pública" on public.schools for select using (true);
create policy "Inserção pública" on public.schools for insert with check (true);
create policy "Atualização pública" on public.schools for update using (true);
create policy "Exclusão pública" on public.schools for delete using (true);

create policy "Leitura pública" on public.classes for select using (true);
create policy "Inserção pública" on public.classes for insert with check (true);
create policy "Atualização pública" on public.classes for update using (true);
create policy "Exclusão pública" on public.classes for delete using (true);

create policy "Leitura pública" on public.subjects for select using (true);
create policy "Inserção pública" on public.subjects for insert with check (true);
create policy "Atualização pública" on public.subjects for update using (true);
create policy "Exclusão pública" on public.subjects for delete using (true);

create policy "Leitura pública" on public.time_slots for select using (true);
create policy "Inserção pública" on public.time_slots for insert with check (true);
create policy "Atualização pública" on public.time_slots for update using (true);
create policy "Exclusão pública" on public.time_slots for delete using (true);

create policy "Leitura pública" on public.activities for select using (true);
create policy "Inserção pública" on public.activities for insert with check (true);
create policy "Atualização pública" on public.activities for update using (true);
create policy "Exclusão pública" on public.activities for delete using (true);

create policy "Leitura pública" on public.journals for select using (true);
create policy "Inserção pública" on public.journals for insert with check (true);
create policy "Atualização pública" on public.journals for update using (true);
create policy "Exclusão pública" on public.journals for delete using (true);`;

  // Handle copying SQL script
  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  // Handle manual force push
  const handlePush = async () => {
    if (!onForceSync) return;
    if (confirm('Atenção: Isso irá substituir todos os dados da Nuvem Supabase pelos seus dados locais atuais. Deseja continuar?')) {
      setIsPushing(true);
      const ok = await onForceSync('push');
      setIsPushing(false);
      if (ok) {
        showSuccess('Todos os dados locais foram enviados com sucesso para a Nuvem!');
      } else {
        showError('Erro ao enviar dados. Verifique sua conexão e configurações.');
      }
    }
  };

  // Handle manual force pull
  const handlePull = async () => {
    if (!onForceSync) return;
    if (confirm('Atenção: Isso irá substituir todos os seus dados locais atuais pelos dados salvos no Supabase. Deseja continuar?')) {
      setIsPulling(true);
      const ok = await onForceSync('pull');
      setIsPulling(false);
      if (ok) {
        showSuccess('Dados importados da Nuvem Supabase com sucesso!');
      } else {
        showError('Erro ao carregar dados. Verifique sua conexão ou se as tabelas possuem registros.');
      }
    }
  };

  // Handle data export to JSON file
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify({
        schools,
        classes,
        subjects,
        timeSlots,
        activities,
        journals,
        exportedAt: new Date().toISOString(),
        app: 'PedagogicalPlanner',
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planejador_pedagogico_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Dados exportados com sucesso! O download do arquivo JSON começou.');
    } catch (err) {
      console.error(err);
      showError('Ocorreu um erro ao exportar os dados. Tente novamente.');
    }
  };

  // Handle data import from JSON file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validation check for basic expected structure
        if (!json.schools || !json.classes || !json.subjects || !json.timeSlots || !json.activities || !json.journals) {
          showError('Estrutura de arquivo inválida. O arquivo JSON deve ser um backup do Planejador Pedagógico.');
          return;
        }

        if (confirm('A importação substituirá TODOS os seus dados atuais. Deseja prosseguir?')) {
          onImportData({
            schools: json.schools,
            classes: json.classes,
            subjects: json.subjects,
            timeSlots: json.timeSlots,
            activities: json.activities,
            journals: json.journals,
          });
          showSuccess('Backup importado e restaurado com sucesso!');
        }
      } catch (err) {
        showError('Erro ao processar o arquivo. Certifique-se de que é um arquivo JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  const handleReset = () => {
    if (confirm('Isso apagará seus dados personalizados e restaurará as escolas e horários de demonstração. Deseja prosseguir?')) {
      onResetData();
      showSuccess('Aplicativo restaurado para os dados iniciais de demonstração!');
    }
  };

  const handleClearAll = () => {
    if (confirm('ATENÇÃO: Isso removerá absolutamente todas as escolas, turmas, disciplinas, horários e diários registrados permanentemente. Tem certeza absoluta de que quer fazer isso?')) {
      onImportData({
        schools: [],
        classes: [],
        subjects: [],
        timeSlots: [],
        activities: [],
        journals: [],
      });
      showSuccess('Todos os dados foram excluídos e o aplicativo está limpo.');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <div id="backup-config-container" className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <Info className="text-indigo-600" size={20} />
          <span>Informações de Armazenamento</span>
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">
          Este aplicativo funciona no lado do cliente. Suas informações são guardadas de forma privada e segura no navegador através do <strong>localStorage</strong>.
          Para usar o app em múltiplos dispositivos em tempo real, configure a conexão com o <strong>Supabase Cloud</strong> abaixo.
        </p>
      </div>

      {/* Alerts Feedback */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-700 text-sm rounded-2xl border border-emerald-100 flex items-center gap-2.5 shadow-2xs">
          <CheckCircle className="flex-shrink-0" size={18} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-2xl border border-rose-100 flex items-center gap-2.5 shadow-2xs">
          <AlertTriangle className="flex-shrink-0" size={18} />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* SUPABASE CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Database className="text-indigo-600" size={20} />
              <span>Sincronização em Nuvem Opcional (Supabase)</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Por padrão, o aplicativo roda <strong>100% local e offline</strong> no seu dispositivo (ideal para isolar dados em cada aparelho/APK). 
              Opcionalmente, configure as chaves do seu próprio banco Supabase para ativar sincronização em nuvem e multi-dispositivos.
            </p>
          </div>

          <div>
            {isSupabaseConfigured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                <Cloud size={14} className="text-emerald-500" />
                <span>Nuvem Ativa e Sincronizada</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                <CloudOff size={14} className="text-indigo-500" />
                <span>100% Local (Ativo por Padrão)</span>
              </div>
            )}
          </div>
        </div>

        {isSupabaseConfigured ? (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block">Painel de Controle Cloud</span>
              <p className="text-xs text-slate-500 font-medium">
                Sua nuvem está ativa! Os dados são salvos de forma automática a cada alteração realizada. Você também pode forçar o envio ou recebimento de dados abaixo caso queira atualizar manualmente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handlePush}
                disabled={isPushing || isPulling}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                {isPushing ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <ArrowUp size={16} />
                )}
                <span>Enviar dados Locais para a Nuvem</span>
              </button>

              <button
                onClick={handlePull}
                disabled={isPushing || isPulling}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-300 text-slate-700 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-slate-200/50"
              >
                {isPulling ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <ArrowDown size={16} />
                )}
                <span>Baixar dados da Nuvem para Local</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleDisconnectSupabase}
                className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-100"
              >
                <CloudOff size={14} />
                <span>Desconectar Nuvem e Voltar ao Modo 100% Local</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            {/* Supabase Connection Form */}
            <form onSubmit={handleSaveSupabaseConfig} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block">Ativar Sincronização em Nuvem</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">URL do Supabase:</label>
                  <input
                    type="text"
                    placeholder="https://sua-url-aqui.supabase.co"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 py-2 px-3 rounded-xl text-xs transition-all font-medium outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Chave Anon (Public API Key):</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-800 py-2 px-3 rounded-xl text-xs transition-all font-medium outline-hidden font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer shadow-xs"
              >
                Salvar Configurações e Conectar Nuvem
              </button>
            </form>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Como configurar seu banco de dados Supabase:</h5>
              <ol className="list-decimal pl-4 text-xs text-slate-500 font-medium space-y-2.5">
                <li>Acesse o <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Supabase (supabase.com)</a> e crie um projeto gratuito.</li>
                <li>
                  No painel do Supabase, clique em <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, cole o script de tabelas abaixo e clique em <strong>Run</strong>:
                  <div className="relative mt-2">
                    <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[10px] rounded-xl overflow-x-auto max-h-48 whitespace-pre leading-relaxed">
                      {sqlScript}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                    >
                      {isCopying ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{isCopying ? 'Copiado!' : 'Copiar SQL'}</span>
                    </button>
                  </div>
                </li>
                <li>
                  No painel lateral do Supabase, vá em <strong>Project Settings</strong> &gt; <strong>API</strong>.
                </li>
                <li>
                  Copie o <strong>Project URL</strong> e a chave <strong>anon public</strong> API Key, insira-os no formulário acima e clique em "Salvar Configurações". Pronto!
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT / IMPORT SECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FileJson className="text-indigo-600" size={18} />
              <span>Backup e Migração</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Exporte seus dados para um arquivo de texto criptografado em formato JSON que pode ser importado futuramente em qualquer navegador ou celular.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {/* Export Button */}
            <button
              id="btn-export-backup"
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download size={18} />
              <span>Exportar Dados (Backup)</span>
            </button>

            {/* Import Button */}
            <label className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center border border-slate-200/50">
              <Upload size={18} />
              <span>Importar Dados (Restaurar)</span>
              <input
                id="input-import-backup"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* FACTORY RESET / CLEAR SECTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <RotateCcw className="text-amber-600" size={18} />
              <span>Restaurar e Limpar</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Restaure o aplicativo para os dados iniciais de demonstração (escolas, turmas e matérias fictícias) ou apague completamente as configurações atuais.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            {/* Reset to Default Button */}
            <button
              id="btn-reset-demo"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <RotateCcw size={18} />
              <span>Restaurar Dados de Demo</span>
            </button>

            {/* Clear All Button */}
            <button
              id="btn-clear-all"
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-rose-100"
            >
              <Trash2 size={18} />
              <span>Limpar Todos os Dados</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
