/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { initialModules, initialMissions } from './data/mockData';
import { LearningModule, DailyMission } from './types';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { BelajarView } from './components/BelajarView';
import { LatihanView } from './components/LatihanView';
import { AksesView } from './components/AksesView';
import { ProfilView } from './components/ProfilView';
import { FocusReaderModal } from './components/FocusReaderModal';
import { FlashcardModal } from './components/FlashcardModal';
import { QuizModal } from './components/QuizModal';
import { VoicePracticeModal } from './components/VoicePracticeModal';
import { AudioNarrationModal } from './components/AudioNarrationModal';
import { AIProcessingModal } from './components/AIProcessingModal';
import { ReadingGuideOverlay } from './components/ReadingGuideOverlay';
import { soundEffects } from './utils/audio';
import { generateLearningModuleWithAI } from './utils/aiGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'belajar' | 'latihan' | 'akses' | 'profil'>('belajar');
  const [xp, setXp] = useState(160);
  const [streakDays, setStreakDays] = useState(5);
  const [modules, setModules] = useState<LearningModule[]>(initialModules);
  const [missions, setMissions] = useState<DailyMission[]>(initialMissions);

  // Accessibility Settings
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [readingRuler, setReadingRuler] = useState(false);
  const [warmTheme, setWarmTheme] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(0.95);

  // Modals
  const [activeReaderModule, setActiveReaderModule] = useState<LearningModule | null>(null);
  const [activeFlashcardModule, setActiveFlashcardModule] = useState<LearningModule | null>(null);
  const [activeQuizModule, setActiveQuizModule] = useState<LearningModule | null>(null);
  const [activeVoiceModule, setActiveVoiceModule] = useState<LearningModule | null>(null);
  const [activeNarrationModule, setActiveNarrationModule] = useState<LearningModule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleGainXp = (amount: number, reason?: string) => {
    setXp((prev) => prev + amount);
    if (reason) {
      showToast(`+${amount} XP! ${reason}`);
    }
  };

  // When completing reading in Focus Reader
  const handleCompleteReading = (moduleId: string) => {
    handleGainXp(20, 'Selesai membaca dengan fokus');
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, masteryPercentage: 100 } : m))
    );
  };

  // When completing adaptive quiz
  const handleCompleteQuiz = (xpGained: number) => {
    handleGainXp(xpGained, 'Kuis adaptif selesai');
    // Check if daily quiz mission is pending
    setMissions((prev) =>
      prev.map((m) =>
        m.type === 'quiz' ? { ...m, completed: true, description: 'Selesai • Berhasil dapat +30 XP' } : m
      )
    );
  };

  // Daily bonus claim
  const allMissionsCompleted = missions.every((m) => m.completed);
  const handleClaimDailyBonus = () => {
    handleGainXp(50, 'Bonus Misi Harian Berhasil Diklaim');
  };

  // Toggle font size sequentially
  const handleCycleFontSize = () => {
    const next: Record<'sm' | 'md' | 'lg' | 'xl', 'sm' | 'md' | 'lg' | 'xl'> = {
      sm: 'md',
      md: 'lg',
      lg: 'xl',
      xl: 'sm',
    };
    const newSize = next[fontSize];
    setFontSize(newSize);
    showToast(`Ukuran teks diubah ke: ${newSize.toUpperCase()}`);
  };

  // AI Generation from input box
  const handleGenerateModule = async (text: string, files: string[]) => {
    setIsGenerating(true);
    try {
      const newMod = await generateLearningModuleWithAI(text, files);
      setModules((prev) => [newMod, ...prev]);
      setIsGenerating(false);
      soundEffects.playSuccess();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
      showToast(`Modul "${newMod.title}" berhasil diolah oleh Teman AI!`);
    } catch {
      setIsGenerating(false);
      showToast('Gagal mengolah catatan. Silakan coba kembali.');
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center bg-[#faf8ff] text-[#131b2e] selection:bg-[#dad7ff] selection:text-[#3525cd] ${
        warmTheme ? 'theme-warm' : ''
      } ${dyslexiaFont ? 'font-dyslexia' : ''}`}
    >
      {/* Reading Guide Line Overlay */}
      <ReadingGuideOverlay active={readingRuler} />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-50 px-4 py-2.5 rounded-2xl bg-[#131b2e] text-white text-[13px] font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span className="material-symbols-outlined text-[18px] text-[#F59E0B] fill-icon">
            verified
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Application Bar (Dynamic based on Belajar vs Latihan vs Other) */}
      <TopAppBar
        activeTab={activeTab}
        xp={xp}
        streakDays={streakDays}
        onOpenProfile={() => setActiveTab('profil')}
        onOpenAkses={() => setActiveTab('akses')}
      />

      {/* Main Tab Screen Content */}
      <div className="w-full flex-1">
        {activeTab === 'belajar' && (
          <BelajarView
            modules={modules}
            missions={missions}
            onOpenReader={(mod) => setActiveReaderModule(mod)}
            onOpenQuiz={(mod) => setActiveQuizModule(mod)}
            onGenerateModule={handleGenerateModule}
            isGenerating={isGenerating}
            onToggleFontSize={handleCycleFontSize}
            currentFontSize={fontSize}
            onToggleRuler={() => {
              setReadingRuler(!readingRuler);
              showToast(readingRuler ? 'Garis Baca Dinonaktifkan' : 'Garis Baca Diaktifkan');
            }}
            rulerActive={readingRuler}
            onToggleWarm={() => {
              setWarmTheme(!warmTheme);
              showToast(warmTheme ? 'Warna Normal' : 'Mode Warna Hangat Aktif');
            }}
            warmActive={warmTheme}
            onGoToLatihan={() => setActiveTab('latihan')}
          />
        )}

        {activeTab === 'latihan' && (
          <LatihanView
            modules={modules}
            onOpenFlashcards={(mod) => setActiveFlashcardModule(mod)}
            onOpenVoice={(mod) => setActiveVoiceModule(mod)}
            onOpenAudioNarration={(mod) => setActiveNarrationModule(mod)}
            onOpenQuiz={(mod) => setActiveQuizModule(mod)}
            onOpenFocusReader={(mod) => setActiveReaderModule(mod)}
            onOpenAiStudioPrompt={() => {
              setActiveTab('belajar');
              showToast('Tulis topik atau unggah fotomu di kotak Teman AI ini!');
            }}
          />
        )}

        {activeTab === 'akses' && (
          <AksesView
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            readingRuler={readingRuler}
            onToggleRuler={() => setReadingRuler(!readingRuler)}
            warmTheme={warmTheme}
            onToggleWarm={() => setWarmTheme(!warmTheme)}
            dyslexiaFont={dyslexiaFont}
            onToggleDyslexiaFont={() => setDyslexiaFont(!dyslexiaFont)}
            speechSpeed={speechSpeed}
            onChangeSpeechSpeed={setSpeechSpeed}
          />
        )}

        {activeTab === 'profil' && (
          <ProfilView
            xp={xp}
            streakDays={streakDays}
            completedMissions={missions.filter((m) => m.completed).length}
            onClaimDailyBonus={handleClaimDailyBonus}
            canClaimBonus={allMissionsCompleted}
          />
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals & Sub-Screens */}
      {activeReaderModule && (
        <FocusReaderModal
          module={activeReaderModule}
          onClose={() => setActiveReaderModule(null)}
          onCompleteReading={handleCompleteReading}
          fontSize={fontSize}
          readingRulerActive={readingRuler}
          onToggleRuler={() => setReadingRuler(!readingRuler)}
          isWarmTheme={warmTheme}
          onToggleWarm={() => setWarmTheme(!warmTheme)}
        />
      )}

      {activeFlashcardModule && (
        <FlashcardModal
          module={activeFlashcardModule}
          onClose={() => setActiveFlashcardModule(null)}
          onComplete={(xpGained) => handleGainXp(xpGained, 'Latihan flashcard selesai')}
        />
      )}

      {activeQuizModule && (
        <QuizModal
          module={activeQuizModule}
          onClose={() => setActiveQuizModule(null)}
          onComplete={handleCompleteQuiz}
        />
      )}

      {activeVoiceModule && (
        <VoicePracticeModal
          module={activeVoiceModule}
          onClose={() => setActiveVoiceModule(null)}
          onComplete={(xpGained) => handleGainXp(xpGained, 'Latihan suara lisan tuntas')}
        />
      )}

      {activeNarrationModule && (
        <AudioNarrationModal
          module={activeNarrationModule}
          onClose={() => setActiveNarrationModule(null)}
        />
      )}

      {/* AI Processing Loading State */}
      <AIProcessingModal isOpen={isGenerating} />
    </div>
  );
}
