import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  linkWithPopup,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  waitForPendingWrites,
  FieldPath,
  deleteField
} from 'firebase/firestore';
import {
  getMemoryTargetCount,
  getSpecialCharacters,
  normalizeVocabItem,
  parseNounEntry,
  validateVocabInput
} from './domain/vocabulary.js';
import {
  cloneDecks,
  mergeDecksPreservingBoth,
  normalizeDecks
} from './domain/decks.js';
import { 
  BookOpen, 
  Gamepad2, 
  Clock, 
  Heart, 
  Trophy, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Languages, 
  Brain, 
  Grid2X2, 
  Star, 
  TrendingDown, 
  Trash2, 
  Volume2, 
  ListChecks, 
  Loader2, 
  Pencil, 
  Plus, 
  Headphones, 
  Keyboard, 
  Flame, 
  Skull, 
  CircleDashed, 
  Search, 
  Sparkles,
  Move,
  Shuffle
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAFgk2ucxJ3KU7uRQHvsGxykm8ctcttCQE",
  authDomain: "duanlingo.firebaseapp.com",
  projectId: "duanlingo",
  storageBucket: "duanlingo.firebasestorage.app",
  messagingSenderId: "523701499406",
  appId: "1:523701499406:web:a1916c58dc99e4978fae5f",
  measurementId: "G-3RH20XBNZ8"
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const STORAGE_KEY = 'vocab_multilingua_v1';
const EMPTY_DECK = Object.freeze({ words: Object.freeze([]), language: 'German' });
// --- INITIAL DATA: 200 Core B1/B2 Vocabulary Items ---

// --- CONSTANTS: Default Starter Vocabulary (15 words per language) ---
// --- CONSTANTS: Default Starter Vocabulary (15 words per language) ---
// Focused on the 8 supported languages
const DEFAULT_VOCAB_SETS = {
  'German': [
    { german: "Hallo", english: "Hello", gender: "phr", example: "Hallo, wie geht es dir?" },
    { german: "Danke", english: "Thank you", gender: "phr", example: "Vielen Dank!" },
    { german: "Ja", english: "Yes", gender: "adv", example: "Ja, bitte." },
    { german: "Nein", english: "No", gender: "adv", example: "Nein, danke." },
    { german: "das Wasser", english: "Water", gender: "n", partOfSpeech: "noun", example: "Ein Glas Wasser, bitte." },
    { german: "das Brot", english: "Bread", gender: "n", partOfSpeech: "noun", example: "Das Brot ist frisch." },
    { german: "der Mann", english: "Man", gender: "n", partOfSpeech: "noun", example: "Der Mann ist groß." },
    { german: "die Frau", english: "Woman", gender: "n", partOfSpeech: "noun", example: "Die Frau liest." },
    { german: "die Liebe", english: "Love", gender: "n", partOfSpeech: "noun", example: "Liebe ist wichtig." },
    { german: "das Haus", english: "House", gender: "n", partOfSpeech: "noun", example: "Das Haus ist alt." },
    { german: "die Katze", english: "Cat", gender: "n", partOfSpeech: "noun", example: "Die Katze schläft." },
    { german: "der Hund", english: "Dog", gender: "n", partOfSpeech: "noun", example: "Der Hund bellt." },
    { german: "essen", english: "to eat", gender: "v", example: "Wir essen Pizza." },
    { german: "trinken", english: "to drink", gender: "v", example: "Ich trinke Kaffee." },
    { german: "glücklich", english: "happy", gender: "adj", example: "Ich bin glücklich." }
  ],
  'Spanish': [
    { german: "Hola", english: "Hello", gender: "phr", example: "¡Hola! ¿Qué tal?" },
    { german: "Gracias", english: "Thank you", gender: "phr", example: "Muchas gracias." },
    { german: "Sí", english: "Yes", gender: "adv", example: "Sí, por favor." },
    { german: "No", english: "No", gender: "adv", example: "No, gracias." },
    { german: "Agua", english: "Water", gender: "n", example: "Agua, por favor." },
    { german: "Pan", english: "Bread", gender: "n", example: "El pan está fresco." },
    { german: "Hombre", english: "Man", gender: "n", example: "El hombre es alto." },
    { german: "Mujer", english: "Woman", gender: "n", example: "La mujer lee." },
    { german: "Amor", english: "Love", gender: "n", example: "El amor es ciego." },
    { german: "Casa", english: "House", gender: "n", example: "Mi casa es tu casa." },
    { german: "Gato", english: "Cat", gender: "n", example: "El gato negro." },
    { german: "Perro", english: "Dog", gender: "n", example: "El perro ladra." },
    { german: "Comer", english: "to eat", gender: "v", example: "Me gusta comer." },
    { german: "Beber", english: "to drink", gender: "v", example: "Quiero beber agua." },
    { german: "Feliz", english: "Happy", gender: "adj", example: "Soy muy feliz." }
  ],
  'Italian': [
    { german: "Ciao", english: "Hello", gender: "phr", example: "Ciao! Come stai?" },
    { german: "Grazie", english: "Thank you", gender: "phr", example: "Grazie mille." },
    { german: "Sì", english: "Yes", gender: "adv", example: "Sì, per favore." },
    { german: "No", english: "No", gender: "adv", example: "No, grazie." },
    { german: "Acqua", english: "Water", gender: "n", example: "Acqua, per favore." },
    { german: "Pane", english: "Bread", gender: "n", example: "Il pane è buono." },
    { german: "Uomo", english: "Man", gender: "n", example: "L'uomo cammina." },
    { german: "Donna", english: "Woman", gender: "n", example: "La donna canta." },
    { german: "Amore", english: "Love", gender: "n", example: "L'amore è tutto." },
    { german: "Casa", english: "House", gender: "n", example: "Vado a casa." },
    { german: "Gatto", english: "Cat", gender: "n", example: "Il gatto dorme." },
    { german: "Cane", english: "Dog", gender: "n", example: "Il cane gioca." },
    { german: "Mangiare", english: "to eat", gender: "v", example: "Voglio mangiare." },
    { german: "Bere", english: "to drink", gender: "v", example: "Posso bere?" },
    { german: "Felice", english: "Happy", gender: "adj", example: "Sono felice." }
  ],
  'French': [
    { german: "Bonjour", english: "Hello", gender: "phr", example: "Bonjour tout le monde." },
    { german: "Merci", english: "Thank you", gender: "phr", example: "Merci beaucoup." },
    { german: "Oui", english: "Yes", gender: "adv", example: "Oui, bien sûr." },
    { german: "Non", english: "No", gender: "adv", example: "Non, désolé." },
    { german: "Eau", english: "Water", gender: "n", example: "De l'eau, s'il vous plaît." },
    { german: "Pain", english: "Bread", gender: "n", example: "Du pain frais." },
    { german: "Homme", english: "Man", gender: "n", example: "L'homme est gentil." },
    { german: "Femme", english: "Woman", gender: "n", example: "La femme travaille." },
    { german: "Amour", english: "Love", gender: "n", example: "C'est mon amour." },
    { german: "Maison", english: "House", gender: "n", example: "Belle maison." },
    { german: "Chat", english: "Cat", gender: "n", example: "Le chat noir." },
    { german: "Chien", english: "Dog", gender: "n", example: "Mon chien." },
    { german: "Manger", english: "to eat", gender: "v", example: "J'aime manger." },
    { german: "Boire", english: "to drink", gender: "v", example: "Il faut boire." },
    { german: "Heureux", english: "Happy", gender: "adj", example: "Je suis heureux." }
  ],
  'Dutch': [
    { german: "Hallo", english: "Hello", gender: "phr", example: "Hallo allemaal." },
    { german: "Dank je", english: "Thank you", gender: "phr", example: "Dank je wel." },
    { german: "Ja", english: "Yes", gender: "adv", example: "Ja, graag." },
    { german: "Nee", english: "No", gender: "adv", example: "Nee, bedankt." },
    { german: "Water", english: "Water", gender: "n", example: "Mag ik wat water?" },
    { german: "Brood", english: "Bread", gender: "n", example: "Lekker brood." },
    { german: "Man", english: "Man", gender: "n", example: "De man loopt." },
    { german: "Vrouw", english: "Woman", gender: "n", example: "De vrouw lacht." },
    { german: "Liefde", english: "Love", gender: "n", example: "Liefde is mooi." },
    { german: "Huis", english: "House", gender: "n", example: "Ons huis." },
    { german: "Kat", english: "Cat", gender: "n", example: "De kat miauwt." },
    { german: "Hond", english: "Dog", gender: "n", example: "De hond blaft." },
    { german: "Eten", english: "to eat", gender: "v", example: "Wij eten samen." },
    { german: "Drinken", english: "to drink", gender: "v", example: "Wat wil je drinken?" },
    { german: "Gelukkig", english: "Happy", gender: "adj", example: "Ik ben gelukkig." }
  ],
  'Russian': [
    { german: "Привет", english: "Hello", gender: "phr", example: "Привет! Как дела?" },
    { german: "Спасибо", english: "Thank you", gender: "phr", example: "Большое спасибо." },
    { german: "Да", english: "Yes", gender: "adv", example: "Да, пожалуйста." },
    { german: "Нет", english: "No", gender: "adv", example: "Нет, спасибо." },
    { german: "Вода", english: "Water", gender: "n", example: "Можно мне воды?" },
    { german: "Хлеб", english: "Bread", gender: "n", example: "Свежий хлеб." },
    { german: "Мужчина", english: "Man", gender: "n", example: "Этот мужчина." },
    { german: "Женщина", english: "Woman", gender: "n", example: "Эта женщина." },
    { german: "Любовь", english: "Love", gender: "n", example: "Любовь важна." },
    { german: "Дом", english: "House", gender: "n", example: "Мой дом." },
    { german: "Кот", english: "Cat", gender: "n", example: "Кот спит." },
    { german: "Собака", english: "Dog", gender: "n", example: "Собака лает." },
    { german: "Есть", english: "to eat", gender: "v", example: "Я хочу есть." },
    { german: "Пить", english: "to drink", gender: "v", example: "Я хочу пить." },
    { german: "Счастливый", english: "Happy", gender: "adj", example: "Я счастливый." }
  ],
  'Polish': [
    { german: "Cześć", english: "Hello", gender: "phr", example: "Cześć! Jak się masz?" },
    { german: "Dziękuję", english: "Thank you", gender: "phr", example: "Dziękuję bardzo." },
    { german: "Tak", english: "Yes", gender: "adv", example: "Tak, poproszę." },
    { german: "Nie", english: "No", gender: "adv", example: "Nie, dziękuję." },
    { german: "Woda", english: "Water", gender: "n", example: "Poproszę wodę." },
    { german: "Chleb", english: "Bread", gender: "n", example: "Świeży chleb." },
    { german: "Mężczyzna", english: "Man", gender: "n", example: "To jest mężczyzna." },
    { german: "Kobieta", english: "Woman", gender: "n", example: "To jest kobieta." },
    { german: "Miłość", english: "Love", gender: "n", example: "Miłość jest ważna." },
    { german: "Dom", english: "House", gender: "n", example: "Duży dom." },
    { german: "Kot", english: "Cat", gender: "n", example: "Kot śpi." },
    { german: "Pies", english: "Dog", gender: "n", example: "Pies szczeka." },
    { german: "Jeść", english: "to eat", gender: "v", example: "Lubię jeść." },
    { german: "Pić", english: "to drink", gender: "v", example: "Chcę pić." },
    { german: "Szczęśliwy", english: "Happy", gender: "adj", example: "Jestem szczęśliwy." }
  ],
  'Czech': [
    { german: "Ahoj", english: "Hello", gender: "phr", example: "Ahoj! Jak se máš?" },
    { german: "Děkuji", english: "Thank you", gender: "phr", example: "Děkuji moc." },
    { german: "Ano", english: "Yes", gender: "adv", example: "Ano, prosím." },
    { german: "Ne", english: "No", gender: "adv", example: "Ne, děkuji." },
    { german: "Voda", english: "Water", gender: "n", example: "Vodu, prosím." },
    { german: "Chléb", english: "Bread", gender: "n", example: "Čerstvý chléb." },
    { german: "Muž", english: "Man", gender: "n", example: "Ten muž je vysoký." },
    { german: "Žena", english: "Woman", gender: "n", example: "Ta žena čte." },
    { german: "Láska", english: "Love", gender: "n", example: "Láska je krásná." },
    { german: "Dům", english: "House", gender: "n", example: "Náš dům." },
    { german: "Kočka", english: "Cat", gender: "n", example: "Kočka spí." },
    { german: "Pes", english: "Dog", gender: "n", example: "Pes štěká." },
    { german: "Jíst", english: "to eat", gender: "v", example: "Jíme oběd." },
    { german: "Pít", english: "to drink", gender: "v", example: "Piju kávu." },
    { german: "Šťastný", english: "Happy", gender: "adj", example: "Jsem šťastný." }
  ],
  'Swedish': [
    { german: "Hej", english: "Hello", gender: "phr", example: "Hej! Hur mår du?" },
    { german: "Tack", english: "Thank you", gender: "phr", example: "Tack så mycket." },
    { german: "Ja", english: "Yes", gender: "adv", example: "Ja, tack." },
    { german: "Nej", english: "No", gender: "adv", example: "Nej, tack." },
    { german: "Vatten", english: "Water", gender: "n", example: "Ett glas vatten, tack." },
    { german: "Bröd", english: "Bread", gender: "n", example: "Brödet är färskt." },
    { german: "Man", english: "Man", gender: "n", example: "Mannen är lång." },
    { german: "Kvinna", english: "Woman", gender: "n", example: "Kvinnan läser." },
    { german: "Kärlek", english: "Love", gender: "n", example: "Kärlek är viktigt." },
    { german: "Hus", english: "House", gender: "n", example: "Huset är gammalt." },
    { german: "Katt", english: "Cat", gender: "n", example: "Katten sover." },
    { german: "Hund", english: "Dog", gender: "n", example: "Hunden skäller." },
    { german: "Äta", english: "to eat", gender: "v", example: "Vi äter pizza." },
    { german: "Dricka", english: "to drink", gender: "v", example: "Jag dricker kaffe." },
    { german: "Glad", english: "Happy", gender: "adj", example: "Jag är glad." }
  ]
};


// --- TYPES & CONSTANTS ---
const STATUS = {
  NEW: 0,        // Not Learned
  LEARNING: 1,   // Learning
  REVIEW: 2,     // Short Term
  DRIFTING: 3,   // Drifting
  MASTERED: 4    // Mastered
};

const STATUS_LABELS = {
  [STATUS.NEW]: "Not Learned",
  [STATUS.LEARNING]: "Learning",
  [STATUS.REVIEW]: "Short Term",
  [STATUS.DRIFTING]: "Drifting",
  [STATUS.MASTERED]: "Mastered"
};

const PROMOTION_REQ = {
    sentence: 1,
    select: 2,
    listening: 2,
    spelling: 2
};

const SESSION_APPEARANCE_LIMIT = 5;

const PART_OF_SPEECH_LABELS = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  phrase: 'Phrase',
  other: 'Other'
};

const GRAMMATICAL_GENDER_LABELS = {
  masculine: 'Masculine',
  feminine: 'Feminine',
  neuter: 'Neuter',
  common: 'Common gender'
};

const getVocabularyTypeLabel = (item) => (
  item.partOfSpeech === 'noun' && item.grammaticalGender
    ? GRAMMATICAL_GENDER_LABELS[item.grammaticalGender] || 'Noun'
    : PART_OF_SPEECH_LABELS[item.partOfSpeech] || 'Vocabulary'
);

const EMPTY_VOCAB_FORM = {
  german: '',
  english: '',
  partOfSpeech: 'noun',
  example: ''
};

const PART_OF_SPEECH_OPTIONS = Object.entries(PART_OF_SPEECH_LABELS);

// --- UTILS ---
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const speak = (text, langCode = 'de-DE', callbacks = {}) => {
  if (!text || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    callbacks.onError?.();
    return false;
  }

  const synth = window.speechSynthesis;
  const utterance = new window.SpeechSynthesisUtterance(text);
  const shortLang = langCode.split('-')[0];
  const languageVoices = synth.getVoices().filter(voice =>
    voice.lang.replace('_', '-').startsWith(shortLang)
  );
  const selectedVoice =
    languageVoices.find(voice => voice.name.includes('Google')) ||
    languageVoices.find(voice => /Siri|Enhanced|Premium/.test(voice.name)) ||
    languageVoices[0];

  utterance.lang = langCode;
  utterance.rate = 0.9;
  utterance.onstart = callbacks.onStart || null;
  utterance.onend = callbacks.onEnd || null;
  utterance.onerror = callbacks.onError || null;
  if (selectedVoice) utterance.voice = selectedVoice;

  synth.cancel();
  synth.speak(utterance);
  return true;
};

// --- SUB-COMPONENTS (Session Games) ---

const StudyCardPreview = ({ card, onReady, langCode }) => {
    return (
        <div className="flex h-full w-full overflow-y-auto p-4 animate-in fade-in zoom-in duration-300 sm:p-6">
            <div className="m-auto w-full max-w-sm rounded-2xl border-2 border-indigo-100 bg-white px-5 py-6 text-center shadow-xl sm:p-8">
                <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">New Word</span>
                <h2 lang={langCode} className="mt-3 break-words text-3xl font-bold leading-tight text-slate-800 sm:text-4xl">{card.german}</h2>
                <div className="mt-1 grid min-h-11 grid-cols-[2.75rem_auto_2.75rem] items-center justify-center">
                    <span className="col-start-2 text-sm italic text-slate-500">
                      {getVocabularyTypeLabel(card)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Play pronunciation for ${card.german}`}
                      onClick={() => speak(card.german, langCode)}
                      className="col-start-3 grid size-11 place-items-center text-indigo-500 hover:text-indigo-700"
                    >
                      <Volume2 className="size-5"/>
                    </button>
                </div>
                <div className="my-4 h-px bg-slate-100"></div>
                <h3 className="text-xl font-medium text-slate-600 sm:text-2xl">{card.english}</h3>
                <div className="mt-4 rounded-xl border-l-4 border-indigo-300 bg-slate-50 p-4 text-left text-sm italic text-slate-600">
                    “{card.example}”
                </div>
                <button 
                    type="button"
                    onClick={onReady}
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
                >
                    <CheckCircle className="size-5" /> I’ve learned it
                </button>
            </div>
        </div>
    );
}

// [新增] 專門給 Learning/Review Session 用的句子重組遊戲
const SessionSentenceBuilder = ({ card, onAnswer, feedbackState }) => {
  const expectedSentence = (card.example || card.german || '').trim();
  const [scrambledWords, setScrambledWords] = useState(() =>
    shuffleArray(expectedSentence.split(/\s+/).filter(Boolean).map((text, id) => ({ id, text })))
  );
  const [selectedWords, setSelectedWords] = useState([]);

  // 點擊下方單字庫 -> 移到上方
  const handleWordClick = (word) => {
    if (feedbackState) return; // 結算後鎖定
    setScrambledWords(prev => prev.filter(w => w.id !== word.id));
    setSelectedWords(prev => [...prev, word]);
  };

  // 點擊上方已選單字 -> 移回下方
  const handleUndo = (word) => {
    if (feedbackState) return; // 結算後鎖定
    setSelectedWords(prev => prev.filter(w => w.id !== word.id));
    setScrambledWords(prev => [...prev, word]);
  };

  // 送出答案
  const check = () => {
    const currentString = selectedWords.map(w => w.text).join(' ');
    const isCorrect = currentString.trim() === expectedSentence;
    
    // 呼叫 SessionController 的標準回答介面 (null 代表沒有特定選項ID)
    onAnswer(null, isCorrect);
  };

  // 根據狀態決定邊框顏色
  let containerClass = "border-slate-300 bg-slate-100";
  if (feedbackState === 'correct') containerClass = "border-green-500 bg-green-50";
  if (feedbackState === 'wrong') containerClass = "border-red-500 bg-red-50";

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-orange-500 font-bold mb-4 tracking-wider">Build the Sentence</div>
      
      {/* 題目：英文意思 */}
      <div className="text-xl text-center text-slate-700 font-medium mb-2 leading-relaxed max-w-lg bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         {card.english}
      </div>
      
      {/* 提示：目標單字 (怕使用者不知道要造哪個句) */}
      <div className="text-xs text-slate-400 mb-6">
         Target word: <span className="font-bold text-indigo-500">{card.german}</span>
      </div>

      {/* 答題區 (上方) */}
      <div className={`w-full max-w-md min-h-[80px] rounded-xl p-4 mb-4 flex flex-wrap gap-2 content-start transition-all border-2 ${containerClass}`}>
        {selectedWords.length === 0 && !feedbackState && (
            <span className="text-slate-400 w-full text-center text-sm select-none py-2">Tap words below</span>
        )}
        {selectedWords.map(word => (
          <button key={word.id} onClick={() => handleUndo(word)} className="bg-white px-3 py-1.5 rounded-lg shadow-sm text-slate-800 font-bold text-sm animate-in zoom-in duration-200">
            {word.text}
          </button>
        ))}
      </div>

      {/* 選項區 (下方) - 只有在還沒答題或答錯時顯示，答對隱藏以保持整潔 */}
      <div className="flex flex-wrap gap-2 justify-center w-full max-w-md mb-8 min-h-[60px]">
        {scrambledWords.map(word => (
          <button key={word.id} onClick={() => handleWordClick(word)} disabled={feedbackState} className="bg-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-200 active:scale-95 transition-all disabled:opacity-50">
            {word.text}
          </button>
        ))}
      </div>

      {/* 錯誤時顯示正確答案 */}
      {feedbackState === 'wrong' && (
          <div className="text-red-500 font-bold mb-4 animate-in fade-in text-center">
              Correct: {expectedSentence}
          </div>
      )}

      {/* 確認按鈕 */}
      {!feedbackState && (
          <button 
            onClick={check} 
            disabled={scrambledWords.length > 0 && selectedWords.length === 0} // 至少選一個字才能送出
            className="bg-slate-800 text-white px-10 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
      )}
    </div>
  );
};

const SelectCardGame = ({ card, options, onAnswer, feedbackState, selectedOption }) => {
  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-blue-500 font-bold mb-2 tracking-wider">Select Translation</div>
      <h2 className="text-3xl font-bold text-slate-800 mb-8">{card.english}</h2>
      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        {options.map(opt => {
           let btnClass = "bg-white border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50";
           if (feedbackState) {
               if (opt.id === card.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800";
               else if (opt.id === selectedOption) btnClass = "bg-red-100 border-2 border-red-500 text-red-800";
               else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50";
           }
           return (
             <button key={opt.id} onClick={() => !feedbackState && onAnswer(opt.id, opt.id === card.id)} className={`p-4 rounded-xl transition-all font-medium text-slate-700 text-lg ${btnClass}`}>{opt.german}</button>
           );
        })}
      </div>
    </div>
  );
};

const ReverseSelectGame = ({ card, options, onAnswer, feedbackState, selectedOption, targetLanguage }) => {
  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-purple-500 font-bold mb-2 tracking-wider">{targetLanguage} to English</div>
      <h2 className="text-4xl font-bold text-slate-800 mb-8">{card.german}</h2>
      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        {options.map(opt => {
           let btnClass = "bg-white border-2 border-slate-100 hover:border-purple-400 hover:bg-purple-50";
           if (feedbackState) {
               if (opt.id === card.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800";
               else if (opt.id === selectedOption) btnClass = "bg-red-100 border-2 border-red-500 text-red-800";
               else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50";
           }
           return (
             <button key={opt.id} onClick={() => !feedbackState && onAnswer(opt.id, opt.id === card.id)} className={`p-4 rounded-xl transition-all font-medium text-slate-700 text-lg ${btnClass}`}>
                {opt.english}
             </button>
           );
        })}
      </div>
    </div>
  );
};

const ListeningGame = ({ card, options, onAnswer, feedbackState, selectedOption, timeLimit = 8, langCode }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timerRunning, setTimerRunning] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(() =>
    'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  );
  const [showTextAlternative, setShowTextAlternative] = useState(false);

  useEffect(() => {
    if (!audioAvailable) return undefined;

    let active = true;
    let speechStarted = false;
    const startFallback = window.setTimeout(() => {
      if (active && !speechStarted) setAudioAvailable(false);
    }, 2500);
    speak(card.german, langCode, {
      onStart: () => {
        speechStarted = true;
        window.clearTimeout(startFallback);
        if (active) setTimerRunning(true);
      },
      onError: () => {
        window.clearTimeout(startFallback);
        if (active) setAudioAvailable(false);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(startFallback);
    };
  }, [audioAvailable, card.german, langCode]);

  useEffect(() => {
    if (!timerRunning || feedbackState) return undefined;
    const timer = window.setInterval(() => setTimeLeft(time => Math.max(0, time - 0.1)), 100);
    return () => window.clearInterval(timer);
  }, [feedbackState, timerRunning]);
  
  useEffect(() => { if (timeLeft === 0 && !feedbackState) onAnswer(null, false); }, [timeLeft, onAnswer, feedbackState]);

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-pink-500 font-bold mb-6 tracking-wider">Listening Challenge</div>
      {audioAvailable && !showTextAlternative ? (
        <>
          <button
            type="button"
            aria-label="Replay pronunciation"
            onClick={() => speak(card.german, langCode, { onError: () => setAudioAvailable(false) })}
            className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-3 hover:scale-105 transition-transform shadow-lg border-4 border-pink-200"
          >
            <Volume2 className="w-10 h-10" />
          </button>
          <button type="button" onClick={() => { setShowTextAlternative(true); setTimerRunning(false); }} className="mb-4 min-h-11 rounded-lg px-4 text-sm font-bold text-pink-700 hover:bg-pink-50">Use text instead</button>
        </>
      ) : (
        <div role="status" className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
          <p className="text-sm font-bold text-amber-800">Text alternative</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">{card.german}</p>
        </div>
      )}
      {audioAvailable && !showTextAlternative && (
        <div
          role="progressbar"
          aria-label="Time remaining"
          aria-valuemin={0}
          aria-valuemax={timeLimit}
          aria-valuenow={Math.max(0, Math.ceil(timeLeft))}
          className="w-full max-w-xs h-2 bg-slate-200 rounded-full mb-8 overflow-hidden"
        >
          <div className="h-full bg-pink-500 transition-all duration-100 ease-linear" style={{ width: `${(timeLeft / timeLimit) * 100}%` }}/>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {options.map(opt => {
           let btnClass = "bg-white border-2 border-slate-100 hover:border-pink-400 hover:bg-pink-50";
           if (feedbackState) {
               if (opt.id === card.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800";
               else if (opt.id === selectedOption) btnClass = "bg-red-100 border-2 border-red-500 text-red-800";
               else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50";
           }
           return (
             <button key={opt.id} onClick={() => !feedbackState && onAnswer(opt.id, opt.id === card.id)} className={`p-4 rounded-xl transition-all font-medium text-slate-700 ${btnClass}`}>{opt.english}</button>
           );
        })}
      </div>
    </div>
  );
};

const SpellingGame = ({ card, onAnswer, feedbackState, langCode, targetLanguage }) => {
  const [input, setInput] = useState('');
  const specialCharacters = getSpecialCharacters(targetLanguage);
  
  const check = () => {
    // FIX: Remove spaces for lenient matching
    const cleanInput = input.trim().toLowerCase().replace(/\s/g, '');
    const cleanTarget = card.german.toLowerCase().replace(/\s/g, '');
    const correct = cleanInput === cleanTarget;
    speak(card.german, langCode); 
    onAnswer(null, correct);
  };

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-teal-500 font-bold mb-2 tracking-wider">Spelling</div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 italic">"{card.english}"</h2>
      
      <div className="relative w-full max-w-md">
          <input 
            autoFocus
            value={input}
            disabled={feedbackState !== null}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !feedbackState && input.trim() && check()}
            aria-label={card.partOfSpeech === 'noun' ? `Type the ${targetLanguage} article and noun` : `Type the ${targetLanguage} translation`}
            className={`w-full p-4 text-center text-xl border-2 rounded-xl outline-none mb-4 transition-all ${
                feedbackState === 'correct' ? 'border-green-500 bg-green-50 text-green-700' :
                feedbackState === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' :
                'border-slate-200 focus:border-teal-500'
            }`}
            placeholder={card.partOfSpeech === 'noun' ? `Type article + noun in ${targetLanguage}...` : `Type in ${targetLanguage}...`}
          />
          {feedbackState && (
              <div className={`absolute right-4 top-4 ${feedbackState === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                  {feedbackState === 'correct' ? <CheckCircle className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}
              </div>
          )}
      </div>

      {feedbackState === 'wrong' && (
          <div className="text-red-500 font-bold mb-4 animate-in fade-in">
              Correct: {card.german}
          </div>
      )}
      
      {!feedbackState && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">{specialCharacters.map(char => (<button type="button" aria-label={`Insert ${char}`} key={char} onClick={() => setInput(prev => prev + char)} className="min-w-11 min-h-11 bg-white border shadow-sm rounded hover:bg-slate-50 font-medium">{char}</button>))}</div>
      )}

      {!feedbackState && (
          <button onClick={check} disabled={!input.trim()} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-50">Check</button>
      )}
    </div>
  );
};

// --- CORE SESSION CONTROLLER ---
const SessionController = ({ vocabList, mode, onComplete, onUpdateItem, langCode, targetLanguage }) => {
  const [activePool, setActivePool] = useState([]);
  const [sessionStats, setSessionStats] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [promotedIds, setPromotedIds] = useState([]);
  const [retainedIds, setRetainedIds] = useState([]);
  const [failedIds, setFailedIds] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [feedbackState, setFeedbackState] = useState(null); 
  const [selectedOption, setSelectedOption] = useState(null); 
  const [activeTask, setActiveTask] = useState(null);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  
  // FIX: Track current index to force unique keys for duplicate vocab instances
  const [sessionStep, setSessionStep] = useState(0);
  const hasInitializedSession = useRef(false);

  const getTaskForCard = useCallback((card) => {
    if (!card) return null;
    if (mode === 'hell') {
        if (card.hellProgress.spelling < 3) return 'spelling';
        if (card.hellProgress.listening < 2) return 'listening';
        return 'spelling';
    }
    if (mode === 'review') {
        const p = card.reviewProgress;
        const revCount = p.reverseSelect || 0; 
        const sentCount = p.sentence || 0;
      
        let tasks = [];
        if (p.select < 1) tasks.push('select');
        if (p.spelling < 2) tasks.push('spelling');
        if (revCount < 1) tasks.push('reverseSelect');
        if (sentCount < 1) tasks.push('sentence');

        if (tasks.length > 0) return tasks[Math.floor(Math.random() * tasks.length)];
        return 'select';
    }
    const { learningProgress: p } = card;
    if (p.select < 2 || p.sentence < 1) { 
        if (p.select < 2 && p.sentence < 1) return Math.random() > 0.5 ? 'select' : 'sentence';
        return p.select < 2 ? 'select' : 'sentence';
    }
    if (p.listening < 2 || p.spelling < 2) {
        if (p.listening < 2 && p.spelling < 2) return Math.random() > 0.5 ? 'listening' : 'spelling';
        return p.listening < 2 ? 'listening' : 'spelling';
    }
    return 'select';
  }, [mode]);

  const initTaskForCard = useCallback((card, list) => {
      const task = getTaskForCard(card);
      setActiveTask(task);
      const distractors = shuffleArray(list.filter(i => i.id !== card.id && !i.isDeleted)).slice(0, 3);
      setCurrentOptions(shuffleArray([card, ...distractors]));
  }, [getTaskForCard]);

  const pickNext = useCallback((pool, stats) => {
      if (pool.length === 0) {
          setIsFinished(true);
          return;
      }
      const nextCard = pool[Math.floor(Math.random() * pool.length)];
      setCurrentCard(nextCard);
      setSessionStep(prev => prev + 1);

      if (mode === 'learning' && nextCard.status === STATUS.NEW && (stats[nextCard.id]?.appearances || 0) === 0) {
          setShowPreview(true);
      } else {
          initTaskForCard(nextCard, vocabList);
      }
  }, [initTaskForCard, mode, vocabList]);

  useEffect(() => {
    if (hasInitializedSession.current) return;
    hasInitializedSession.current = true;

    let candidates = [];
    const activeList = vocabList.filter(i => !i.isDeleted);

    if (mode === 'learning') {
       const pool = activeList.filter(i => i.status === STATUS.NEW || i.status === STATUS.LEARNING);
       const learning = pool.filter(i => i.status === STATUS.LEARNING);
       const brandNew = pool.filter(i => i.status === STATUS.NEW);
       candidates = [...learning];
       if (candidates.length < 8) candidates = [...candidates, ...shuffleArray(brandNew).slice(0, 8 - candidates.length)];
    } else if (mode === 'review') {
      const driftingPool = activeList.filter(i => i.status === STATUS.DRIFTING);
      const hasAnyReviewProgress = (progress) => (
        (progress?.select || 0) > 0 ||
        (progress?.spelling || 0) > 0 ||
        (progress?.reverseSelect || 0) > 0 ||
        (progress?.sentence || 0) > 0
      );
      const withProgress = driftingPool.filter(i => hasAnyReviewProgress(i.reviewProgress));
      const noProgress = driftingPool.filter(i => !hasAnyReviewProgress(i.reviewProgress));

      candidates = withProgress.length >= 10
        ? shuffleArray(withProgress).slice(0, 10)
        : [...withProgress, ...shuffleArray(noProgress).slice(0, 10 - withProgress.length)];
    } else if (mode === 'hell') {
       candidates = shuffleArray(activeList.filter(i => i.isNigate)).slice(0, 4);
    }

    if (candidates.length === 0) {
      onComplete([]);
      return;
    }

    const stats = Object.fromEntries(candidates.map(card => [card.id, { appearances: 0 }]));
    setSessionStats(stats);
    setActivePool(candidates);
    pickNext(candidates, stats);
  }, [mode, onComplete, pickNext, vocabList]);

  const checkPromotion = (card) => {
      if (mode === 'learning') {
          const p = card.learningProgress;
          return p.sentence >= PROMOTION_REQ.sentence && 
                 p.select >= PROMOTION_REQ.select && 
                 p.listening >= PROMOTION_REQ.listening && 
                 p.spelling >= PROMOTION_REQ.spelling;
      }
      if (mode === 'review') {
        return (card.reviewProgress.select || 0) >= 1 &&
        (card.reviewProgress.spelling || 0) >= 2 &&
        (card.reviewProgress.reverseSelect || 0) >= 1 &&
        (card.reviewProgress.sentence || 0) >= 1;
      }
      return false;
  };

  const handlePreviewDone = () => {
      setShowPreview(false);
      initTaskForCard(currentCard, vocabList);
  };

  const handleAnswer = (optionId, isCorrect) => {
    if (isProcessing) return;
    setIsProcessing(true);

    setFeedbackState(isCorrect ? 'correct' : 'wrong');
    setSelectedOption(optionId);
    
    // set the time between the questions (the time to pronounce the answer)
    let transitionDelay = 1500; 


    if (activeTask === 'sentence') {
        speak(currentCard.example || currentCard.german, langCode);
        transitionDelay = 4000; 
        
    } else if (activeTask !== 'spelling' && activeTask !== 'listening') {
        speak(currentCard.german, langCode);
        transitionDelay = 1500;
    }

    setTimeout(() => {
        const stats = sessionStats[currentCard.id] || { failures: 0, appearances: 0 };
        const newAppearances = stats.appearances + 1;
        const currentFailures = (stats.failures || 0) + (isCorrect ? 0 : 1);
        const updatedStats = { ...sessionStats, [currentCard.id]: { failures: currentFailures, appearances: newAppearances } };
        setSessionStats(updatedStats);

        let updatedCard = {
          ...currentCard,
          learningProgress: { ...currentCard.learningProgress },
          reviewProgress: { ...currentCard.reviewProgress },
          hellProgress: { ...currentCard.hellProgress },
          lastInteraction: Date.now()
        };
        let nextPool = [...activePool];
        
        if (mode === 'hell') {
            if (isCorrect) {
                if (activeTask === 'spelling') updatedCard.hellProgress.spelling++;
                if (activeTask === 'listening') updatedCard.hellProgress.listening++;
                
                if (updatedCard.hellProgress.spelling >= 3 && updatedCard.hellProgress.listening >= 2) {
                    updatedCard.isNigate = false;
                    updatedCard.hellProgress = { spelling: 0, listening: 0 };

                    updatedCard.cumulativeFailures = 0;

                    if (updatedCard.status > STATUS.LEARNING) {
                      updatedCard.status = STATUS.REVIEW;
                    }
                    nextPool = nextPool.filter(c => c.id !== updatedCard.id);
                    setPromotedIds(prev => [...prev, updatedCard]);
                    onUpdateItem(updatedCard);
                    setCurrentCard(updatedCard);
                    setShowPromotion(true);
                    setTimeout(() => {
                        setShowPromotion(false);
                        setFeedbackState(null);
                        setSelectedOption(null);
                        setIsProcessing(false);
                        setActivePool(nextPool);
                        pickNext(nextPool, updatedStats);
                    }, 2000);
                    return;
                } else {
                    onUpdateItem(updatedCard);
                    nextPool = nextPool.map(c => c.id === updatedCard.id ? updatedCard : c);
                }
            } else {
                updatedCard.hellProgress = { spelling: 0, listening: 0 };
                nextPool = nextPool.filter(c => c.id !== updatedCard.id);
                setFailedIds(prev => [...prev, updatedCard]);
                onUpdateItem(updatedCard);
            }
        } else {
            if (isCorrect) {
               if (mode === 'learning') {
                   if (activeTask === 'sentence') updatedCard.learningProgress.sentence++;
                   if (activeTask === 'select') updatedCard.learningProgress.select++;
                   if (activeTask === 'listening') updatedCard.learningProgress.listening++;
                   if (activeTask === 'spelling') updatedCard.learningProgress.spelling++;
                   if (updatedCard.status === STATUS.NEW) updatedCard.status = STATUS.LEARNING;
               } else if (mode === 'review') {
                   if (activeTask === 'select') updatedCard.reviewProgress.select++;
                   if (activeTask === 'spelling') updatedCard.reviewProgress.spelling++;
                   if (activeTask === 'reverseSelect') {
                    updatedCard.reviewProgress.reverseSelect = (updatedCard.reviewProgress.reverseSelect || 0) + 1;
                }
                   if (activeTask === 'sentence') {
                  updatedCard.reviewProgress.sentence = (updatedCard.reviewProgress.sentence || 0) + 1;
             }
               }
            } else {
                updatedCard.cumulativeFailures = (updatedCard.cumulativeFailures || 0) + 1;

                if (updatedCard.cumulativeFailures >= 2 && !updatedCard.isNigate) {
                  updatedCard.isNigate = true;
                  updatedCard.successStreak = 0; // Reset streak on Nigate
                }
            }

            

            const isPromoted = isCorrect && checkPromotion(updatedCard);
            const isSessionMax = newAppearances >= SESSION_APPEARANCE_LIMIT;
            
            nextPool = activePool.map(c => c.id === updatedCard.id ? updatedCard : c);

            if (isPromoted) {
                nextPool = nextPool.filter(c => c.id !== updatedCard.id);
                let changes = { lastReviewed: Date.now() };
                
                // --- NEW MASTER PROMOTION LOGIC ---
                if (mode === 'learning') {
                    // Promotion from Learning always goes to Review, streak starts at 0
                    changes.status = STATUS.REVIEW;
                    changes.successStreak = 0;
                } else if (mode === 'review') {
                    // Promotion from Review checks streak
                    const currentStreak = (updatedCard.successStreak || 0) + 1;
                    changes.successStreak = currentStreak;
                    
                    // The 3-Step Master Rule
                    if (currentStreak >= 3) {
                        changes.status = STATUS.MASTERED;
                    } else {
                        changes.status = STATUS.REVIEW;
                    }
                }
                
                const finalCard = { ...updatedCard, ...changes };
                onUpdateItem(finalCard);
                setPromotedIds(prev => [...prev, finalCard]);
                setCurrentCard(finalCard);
                setShowPromotion(true);
                setTimeout(() => {
                    setShowPromotion(false);
                    setFeedbackState(null);
                    setSelectedOption(null);
                    setIsProcessing(false);
                    setActivePool(nextPool);
                    pickNext(nextPool, updatedStats);
                }, 2000);
                return;
            }

            onUpdateItem(updatedCard);

            if (isSessionMax) {
                 nextPool = nextPool.filter(c => c.id !== updatedCard.id);
                 setRetainedIds(prev => [...prev, updatedCard]);
            }
        }

        setActivePool(nextPool);
        setFeedbackState(null);
        setSelectedOption(null);
        setIsProcessing(false);
        pickNext(nextPool, updatedStats);
    }, transitionDelay);
  };

  if (isFinished) {
    return (
        <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-in zoom-in">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h2>
                <div className="text-left mt-6 mb-6 max-h-60 overflow-y-auto w-full">
                    {promotedIds.length > 0 && (
                        <>
                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Promoted / Cleared ({promotedIds.length})</h3>
                            <div className="space-y-2 mb-4">
                                {promotedIds.map(w => (
                                    <div key={w.id} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded border border-green-100 text-green-800">
                                        <CheckCircle className="w-4 h-4"/> 
                                        <div>
                                            <span className="font-bold">{w.german}</span>
                                            {w.status === STATUS.MASTERED && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">MASTERED</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {retainedIds.length > 0 && (
                        <>
                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Retained ({retainedIds.length})</h3>
                            <div className="space-y-2 mb-4">
                                {retainedIds.map(w => (
                                    <div key={w.id} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-100 text-slate-800">
                                        <RotateCcw className="w-4 h-4"/> 
                                        <div><span className="font-bold">{w.german}</span></div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {failedIds.length > 0 && (
                        <>
                            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Sent to Hell Training ({failedIds.length})</h3>
                            <div className="space-y-2">
                                {failedIds.map(w => (
                                    <div key={w.id} className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded border border-red-100 text-red-800">
                                        <XCircle className="w-4 h-4"/> 
                                        <div><span className="font-bold">{w.german}</span></div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <button onClick={onComplete} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">Back to Dashboard</button>
            </div>
        </div>
    );
  }

  if (!currentCard) return <div className="p-10 text-center">Loading session...</div>;

  if (showPromotion) {
      const isMasterPromotion = currentCard.status === STATUS.MASTERED;
      return (
          <div className="flex flex-col h-full bg-slate-100 items-center justify-center p-6 animate-in zoom-in">
              <Sparkles className={`w-24 h-24 mb-6 animate-spin-slow ${isMasterPromotion ? 'text-purple-500' : 'text-yellow-400'}`} />
              <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
                  {mode === 'hell' ? 'NIGATE Cleared!' : isMasterPromotion ? 'MASTERED!' : 'Promoted!'}
              </h1>
              <p className="text-slate-500 font-medium">{currentCard.german}</p>
              {isMasterPromotion && <p className="text-sm text-purple-600 mt-2 font-bold uppercase tracking-widest">Long Term Memory Unlocked</p>}
          </div>
      );
  }

  if (showPreview) {
      return <StudyCardPreview card={currentCard} onReady={handlePreviewDone} langCode={langCode} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
       <div className="bg-white p-4 flex justify-between items-center shadow-sm z-10">
          <button type="button" aria-label="Exit session" onClick={onComplete} className="min-h-11 min-w-11 text-slate-500 hover:text-slate-700 flex items-center justify-center"><XCircle className="w-6 h-6"/></button>
          <div className="flex items-center gap-2">
              {mode === 'hell' && <Flame className="w-5 h-5 text-red-500 animate-pulse" />}
              <span className="font-bold text-slate-700 uppercase text-sm tracking-wide">{mode === 'hell' ? 'Hell Training' : `${mode} Session`}</span>
          </div>
          <div className="w-6"></div>
       </div>
       {mode !== 'hell' && (
         <>
           <div role="progressbar" aria-label="Remaining turns for this word" aria-valuemin={0} aria-valuemax={5} aria-valuenow={Math.max(0, 5 - (sessionStats[currentCard.id]?.appearances || 0))} className="h-1 bg-slate-200 w-full"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((5 - (sessionStats[currentCard.id]?.appearances || 0)) / 5) * 100}%` }} /></div>
           <div role="status" aria-live="polite" className="sr-only">
             {feedbackState === 'correct' ? 'Correct answer.' : feedbackState === 'wrong' ? `Incorrect. The correct answer is ${currentCard.german}.` : ''}
           </div>
         </>
       )}
       <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto relative">
           {currentCard.isNigate && mode !== 'hell' && (<div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full"><Skull className="w-3 h-3" /> NIGATE</div>)}
           {activeTask === 'sentence' && (
               <SessionSentenceBuilder 
                   key={currentCard.id + 'sen' + sessionStep} 
                   card={currentCard} 
                   onAnswer={handleAnswer} 
                   feedbackState={feedbackState} 
               />
           )}
           {activeTask === 'select' && <SelectCardGame key={currentCard.id + 'sel' + sessionStep} card={currentCard} options={currentOptions} onAnswer={handleAnswer} feedbackState={feedbackState} selectedOption={selectedOption} />}
           {activeTask === 'reverseSelect' && <ReverseSelectGame key={currentCard.id + 'rev' + sessionStep} card={currentCard} options={currentOptions} onAnswer={handleAnswer} feedbackState={feedbackState} selectedOption={selectedOption} targetLanguage={targetLanguage} />}
           {activeTask === 'listening' && <ListeningGame key={currentCard.id + 'lis' + sessionStep} card={currentCard} options={currentOptions} onAnswer={handleAnswer} feedbackState={feedbackState} selectedOption={selectedOption} langCode={langCode}/>}
           {/* FIX: Add sessionStep to key to force reset on re-render of same word */}
           {activeTask === 'spelling' && <SpellingGame key={currentCard.id + 'spe' + sessionStep} card={currentCard} onAnswer={handleAnswer} feedbackState={feedbackState} langCode={langCode} targetLanguage={targetLanguage}/>}
       </div>
    </div>
  );
};

// --- ARCADE GAMES ---

const ArcadeConfig = ({ onStart, title, onBack, vocabList }) => {
    const [gameMode, setGameMode] = useState('mix');
    const starredCount = vocabList.filter(w => w.isStarred && !w.isDeleted).length;

    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full animate-in zoom-in">
           <h2 className="text-2xl font-bold text-slate-800 mb-6">{title} Settings</h2>
           <div className="space-y-4 mb-8">
             <button onClick={() => setGameMode('mix')} className={`w-full p-4 rounded-xl border-2 flex items-center justify-between ${gameMode === 'mix' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
               <div className="text-left"><div className="font-bold text-slate-800">Mix Mode</div><div className="text-xs text-slate-500">All available words</div></div>
               {gameMode === 'mix' && <CheckCircle className="w-5 h-5 text-indigo-600"/>}
             </button>
             <button disabled={starredCount === 0} onClick={() => setGameMode('starred')} className={`w-full p-4 rounded-xl border-2 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${gameMode === 'starred' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
               <div className="text-left"><div className="font-bold text-slate-800 flex items-center gap-2"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/> Favorites Only</div><div className="text-xs text-slate-500">{starredCount} words</div></div>
               {gameMode === 'starred' && <CheckCircle className="w-5 h-5 text-indigo-600"/>}
             </button>
           </div>
           <button onClick={() => onStart(gameMode)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg">Start Game</button>
           <button onClick={onBack} className="mt-4 text-slate-500 text-sm hover:text-slate-800">Back</button>
        </div>
      </div>
    );
};

// 1. BLITZ (Standard German -> English)
const FlashcardGame = ({ onBack, vocabList, onUpdateItem, langCode }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(4); 
  const [isActive, setIsActive] = useState(false);
  const [testedWords, setTestedWords] = useState([]); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null); 
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const nextRound = useCallback(() => {
    if (vocabList.length === 0) return;
    const target = vocabList[Math.floor(Math.random() * vocabList.length)];
    const distractors = vocabList.filter(i => i.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    setCurrentCard(target);
    setOptions(shuffleArray([target, ...distractors]));
    setTimeLeft(4);
    setIsActive(true);
    setFeedback(null);
    setSelectedOptionId(null);
    setProcessing(false);
  }, [vocabList]);

  const handleTimeout = useCallback(() => {
      const newLives = lives - 1;
      setLives(newLives);
      setTestedWords(prev => [...prev, { ...currentCard, correct: false }]);
      if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
  }, [currentCard, lives, nextRound]);

  useEffect(() => {
    if (!isActive && !isGameOver && vocabList.length > 0) nextRound();
  }, [isActive, isGameOver, nextRound, vocabList.length]);

  useEffect(() => {
      if (isActive && timeLeft > 0 && !isGameOver && !processing) {
          const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
          return () => clearInterval(timer);
      } else if (isActive && timeLeft <= 0 && !isGameOver && !processing) {
          handleTimeout();
      }
  }, [handleTimeout, isActive, timeLeft, isGameOver, processing]);

  const handleAnswer = (option) => {
      if (processing) return; 
      setProcessing(true);
      const correct = option.id === currentCard.id;
      setSelectedOptionId(option.id);
      setFeedback(correct ? 'correct' : 'wrong');
      speak(currentCard.german, langCode);
      setTimeout(() => {
          setTestedWords(prev => [...prev, { ...currentCard, correct }]);
          if (correct) {
              setScore(s => s + 10);
              onUpdateItem({ ...currentCard, familiarity: Math.min(5, (currentCard.familiarity || 0) + 1) });
              nextRound();
          } else {
              const newLives = lives - 1;
              setLives(newLives);
              if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
          }
      }, 1000); 
  };

  if (vocabList.length === 0) return <div className="p-8 text-center">No words available.</div>;

  if (isGameOver) {
      return (
          <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-6 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in">
                  <Gamepad2 className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Game Over</h2>
                  <div className="text-xl font-medium text-slate-600 mb-6">Final Score: {score}</div>
                  <div className="text-left max-h-60 overflow-y-auto w-full mb-6 space-y-2">
                       {testedWords.map((item, idx) => (
                           <div key={idx} className={`flex justify-between items-center p-2 rounded border ${item.correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                               <div><div className="font-bold text-slate-700">{item.german}</div><div className="text-xs text-slate-500 italic">{item.english}</div></div>
                               {item.correct ? <CheckCircle className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                           </div>
                       ))}
                  </div>
                  <button onClick={onBack} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">Back to Menu</button>
              </div>
          </div>
      );
  }

  return (
      <div className="flex flex-col h-full bg-slate-100">
          <div className="bg-white p-4 flex justify-between items-center shadow-sm">
              <button type="button" aria-label="Back to arcade menu" onClick={onBack} className="min-h-11 min-w-11 flex items-center justify-center"><ArrowRight className="rotate-180 w-6 h-6 text-slate-500"/></button>
              <div role="status" aria-label={`${lives} lives remaining`} className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart aria-hidden="true" key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />))}</div>
              <div className="font-bold text-indigo-600 text-xl">{score}</div>
          </div>
          <div role="progressbar" aria-label="Time remaining" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.max(0, Math.ceil(timeLeft))} className="h-2 bg-slate-200"><div className="h-full bg-red-500 transition-all duration-100 linear" style={{ width: `${(timeLeft/4)*100}%` }}></div></div>
          <div className="flex-1 flex flex-col justify-center p-6 items-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-8">{currentCard?.german}</h1>
              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {options.map(opt => {
                      let btnClass = "bg-white border-2 border-slate-100 hover:bg-indigo-50 text-slate-700";
                      if (feedback) {
                          if (opt.id === currentCard.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800"; 
                          else if (opt.id === selectedOptionId && feedback === 'wrong') btnClass = "bg-red-100 border-2 border-red-500 text-red-800"; 
                          else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50"; 
                      }
                      return (<button key={opt.id} onClick={() => handleAnswer(opt)} disabled={processing} className={`p-4 rounded-xl shadow-sm font-medium transition-all ${btnClass}`}>{opt.english}</button>);
                  })}
              </div>
          </div>
      </div>
  );
};

// 1.5 REVERSE BLITZ (English -> German)
const ReverseBlitzGame = ({ onBack, vocabList, onUpdateItem, langCode, targetLanguage }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(4); 
  const [isActive, setIsActive] = useState(false);
  const [testedWords, setTestedWords] = useState([]); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null); 
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const nextRound = useCallback(() => {
    if (vocabList.length === 0) return;
    const target = vocabList[Math.floor(Math.random() * vocabList.length)];
    const distractors = vocabList.filter(i => i.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    setCurrentCard(target);
    setOptions(shuffleArray([target, ...distractors]));
    setTimeLeft(4);
    setIsActive(true);
    setFeedback(null);
    setSelectedOptionId(null);
    setProcessing(false);
  }, [vocabList]);

  const handleTimeout = useCallback(() => {
      const newLives = lives - 1;
      setLives(newLives);
      setTestedWords(prev => [...prev, { ...currentCard, correct: false }]);
      if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
  }, [currentCard, lives, nextRound]);

  useEffect(() => {
    if (!isActive && !isGameOver && vocabList.length > 0) nextRound();
  }, [isActive, isGameOver, nextRound, vocabList.length]);

  useEffect(() => {
      if (isActive && timeLeft > 0 && !isGameOver && !processing) {
          const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
          return () => clearInterval(timer);
      } else if (isActive && timeLeft <= 0 && !isGameOver && !processing) {
          handleTimeout();
      }
  }, [handleTimeout, isActive, timeLeft, isGameOver, processing]);

  const handleAnswer = (option) => {
      if (processing) return; 
      setProcessing(true);
      const correct = option.id === currentCard.id;
      setSelectedOptionId(option.id);
      setFeedback(correct ? 'correct' : 'wrong');
      
      // Speak the correct German word immediately for reinforcement
      speak(currentCard.german, langCode);

      setTimeout(() => {
          setTestedWords(prev => [...prev, { ...currentCard, correct }]);
          if (correct) {
              setScore(s => s + 10);
              onUpdateItem({ ...currentCard, familiarity: Math.min(5, (currentCard.familiarity || 0) + 1) });
              nextRound();
          } else {
              const newLives = lives - 1;
              setLives(newLives);
              if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
          }
      }, 1000); 
  };

  if (vocabList.length === 0) return <div className="p-8 text-center">No words available.</div>;

  if (isGameOver) {
      return (
          <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-6 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in">
                  <Gamepad2 className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Game Over</h2>
                  <div className="text-xl font-medium text-slate-600 mb-6">Final Score: {score}</div>
                  <div className="text-left max-h-60 overflow-y-auto w-full mb-6 space-y-2">
                       {testedWords.map((item, idx) => (
                           <div key={idx} className={`flex justify-between items-center p-2 rounded border ${item.correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                               <div><div className="font-bold text-slate-700">{item.german}</div><div className="text-xs text-slate-500 italic">{item.english}</div></div>
                               {item.correct ? <CheckCircle className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                           </div>
                       ))}
                  </div>
                  <button onClick={onBack} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">Back to Menu</button>
              </div>
          </div>
      );
  }

  return (
      <div className="flex flex-col h-full bg-slate-100">
          <div className="bg-white p-4 flex justify-between items-center shadow-sm">
              <button type="button" aria-label="Back to arcade menu" onClick={onBack} className="min-h-11 min-w-11 flex items-center justify-center"><ArrowRight className="rotate-180 w-6 h-6 text-slate-500"/></button>
              <div role="status" aria-label={`${lives} lives remaining`} className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart aria-hidden="true" key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />))}</div>
              <div className="font-bold text-indigo-600 text-xl">{score}</div>
          </div>
          <div role="progressbar" aria-label="Time remaining" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.max(0, Math.ceil(timeLeft))} className="h-2 bg-slate-200"><div className="h-full bg-red-500 transition-all duration-100 linear" style={{ width: `${(timeLeft/4)*100}%` }}></div></div>
          <div className="flex-1 flex flex-col justify-center p-6 items-center">
              <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Translate to {targetLanguage}</div>
              <h1 className="text-3xl font-bold text-slate-800 mb-8 text-center">{currentCard?.english}</h1>
              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {options.map(opt => {
                      let btnClass = "bg-white border-2 border-slate-100 hover:bg-indigo-50 text-slate-700";
                      if (feedback) {
                          if (opt.id === currentCard.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800"; 
                          else if (opt.id === selectedOptionId && feedback === 'wrong') btnClass = "bg-red-100 border-2 border-red-500 text-red-800"; 
                          else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50"; 
                      }
                      return (<button key={opt.id} onClick={() => handleAnswer(opt)} disabled={processing} className={`p-4 rounded-xl shadow-sm font-medium transition-all ${btnClass}`}>{opt.german}</button>);
                  })}
              </div>
          </div>
      </div>
  );
};

// 1.6 LISTENING GAME (ARCADE)
const ArcadeListeningGame = ({ onBack, vocabList, onUpdateItem, langCode }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [testedWords, setTestedWords] = useState([]); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null); 
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(() =>
    'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  );
  const [showTextAlternative, setShowTextAlternative] = useState(false);

  const nextRound = useCallback(() => {
    if (vocabList.length === 0) return;
    const target = vocabList[Math.floor(Math.random() * vocabList.length)];
    const distractors = vocabList.filter(i => i.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    setCurrentCard(target);
    setOptions(shuffleArray([target, ...distractors]));
    setIsActive(true);
    setFeedback(null);
    setSelectedOptionId(null);
    setProcessing(false);
    setShowTextAlternative(false);
    
    // Play audio on start of round
    setTimeout(() => {
      const didStart = speak(target.german, langCode, { onError: () => setAudioAvailable(false) });
      if (!didStart) setAudioAvailable(false);
    }, 500);
  }, [langCode, vocabList]);

  useEffect(() => {
    if (!isActive && !isGameOver && vocabList.length > 0) nextRound();
  }, [isActive, isGameOver, nextRound, vocabList.length]);

  const handleAnswer = (option) => {
      if (processing) return; 
      setProcessing(true);
      const correct = option.id === currentCard.id;
      setSelectedOptionId(option.id);
      setFeedback(correct ? 'correct' : 'wrong');
      
      // Reinforce audio
      speak(currentCard.german, langCode);

      setTimeout(() => {
          setTestedWords(prev => [...prev, { ...currentCard, correct }]);
          if (correct) {
              setScore(s => s + 10);
              onUpdateItem({ ...currentCard, familiarity: Math.min(5, (currentCard.familiarity || 0) + 1) });
              nextRound();
          } else {
              const newLives = lives - 1;
              setLives(newLives);
              if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
          }
      }, 1000); 
  };

  if (vocabList.length === 0) return <div className="p-8 text-center">No words available.</div>;

  if (isGameOver) {
      return (
          <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-6 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in">
                  <Headphones className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Game Over</h2>
                  <div className="text-xl font-medium text-slate-600 mb-6">Final Score: {score}</div>
                  <div className="text-left max-h-60 overflow-y-auto w-full mb-6 space-y-2">
                       {testedWords.map((item, idx) => (
                           <div key={idx} className={`flex justify-between items-center p-2 rounded border ${item.correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                               <div><div className="font-bold text-slate-700">{item.german}</div><div className="text-xs text-slate-500 italic">{item.english}</div></div>
                               {item.correct ? <CheckCircle className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}
                           </div>
                       ))}
                  </div>
                  <button onClick={onBack} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors">Back to Menu</button>
              </div>
          </div>
      );
  }

  return (
      <div className="flex flex-col h-full bg-slate-100">
          <div className="bg-white p-4 flex justify-between items-center shadow-sm">
              <button type="button" aria-label="Back to arcade menu" onClick={onBack} className="min-h-11 min-w-11 flex items-center justify-center"><ArrowRight className="rotate-180 w-6 h-6 text-slate-500"/></button>
              <div role="status" aria-label={`${lives} lives remaining`} className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart aria-hidden="true" key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />))}</div>
              <div className="font-bold text-pink-600 text-xl">{score}</div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center p-6 items-center">
              <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Listen & Translate</div>
              
              {audioAvailable && !showTextAlternative ? (
                <>
                  <button
                    type="button"
                    aria-label="Replay pronunciation"
                    onClick={() => speak(currentCard?.german, langCode, { onError: () => setAudioAvailable(false) })}
                    className="w-32 h-32 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-3 hover:scale-105 transition-transform shadow-lg border-4 border-pink-200"
                  >
                    <Volume2 className="w-12 h-12" />
                  </button>
                  <button type="button" onClick={() => setShowTextAlternative(true)} className="mb-5 min-h-11 rounded-lg px-4 text-sm font-bold text-pink-700 hover:bg-pink-50">Use text instead</button>
                </>
              ) : (
                <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-sm font-bold text-amber-800">Text alternative</p>
                  <p className="mt-2 text-3xl font-bold text-slate-800">{currentCard?.german}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {options.map(opt => {
                      let btnClass = "bg-white border-2 border-slate-100 hover:bg-pink-50 text-slate-700";
                      if (feedback) {
                          if (opt.id === currentCard.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800"; 
                          else if (opt.id === selectedOptionId && feedback === 'wrong') btnClass = "bg-red-100 border-2 border-red-500 text-red-800"; 
                          else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50"; 
                      }
                      return (<button key={opt.id} onClick={() => handleAnswer(opt)} disabled={processing} className={`p-4 rounded-xl shadow-sm font-medium transition-all ${btnClass}`}>{opt.english}</button>);
                  })}
              </div>
          </div>
      </div>
  );
};

// 2. MEMORY MATCH
const MemoryMatchGame = ({ onBack, vocabList }) => {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]); 
  const [flipCount, setFlipCount] = useState(0); 
  const [isGameOver, setIsGameOver] = useState(false);
  const [gamePhase, setGamePhase] = useState('init'); 
  const [previewCount, setPreviewCount] = useState(10);

  useEffect(() => {
      if (gamePhase === 'preview') {
          if (previewCount > 0) {
              const timer = setInterval(() => setPreviewCount(c => c - 1), 1000);
              return () => clearInterval(timer);
          } else {
              setGamePhase('playing');
          }
      }
  }, [gamePhase, previewCount]);

  const initializeGame = useCallback(() => {
    if (vocabList.length === 0) return;
    const learnedWords = vocabList.filter(w => (w.familiarity || 0) > 0);
    const sourceList = learnedWords.length >= 8 ? learnedWords : vocabList;
    const targetCount = getMemoryTargetCount(sourceList.length);
    const selectedWords = shuffleArray(sourceList).slice(0, targetCount);
    const cardPairs = selectedWords.flatMap(word => [
      { id: word.id, content: word.german, type: 'de', uniqueId: `${word.id}-de` },
      { id: word.id, content: word.english, type: 'en', uniqueId: `${word.id}-en` }
    ]);
    setCards(shuffleArray(cardPairs));
    setFlippedIndices([]);
    setMatchedIds([]);
    setFlipCount(0);
    setIsGameOver(false);
    setPreviewCount(10);
    setGamePhase('preview');
  }, [vocabList]);

  useEffect(() => {
    if (gamePhase === 'init') initializeGame();
  }, [gamePhase, initializeGame]);

  const handleCardClick = (index) => {
    if (gamePhase !== 'playing') return; 
    if (flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedIds.includes(cards[index].id)) return;
    
    setFlipCount(prev => prev + 1);
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    
    if (newFlipped.length === 2) {
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];
      if (firstCard.id === secondCard.id) {
        setTimeout(() => {
          setMatchedIds(prev => {
            const newMatched = [...prev, firstCard.id];
            if (newMatched.length === cards.length / 2) setIsGameOver(true);
            return newMatched;
          });
          setFlippedIndices([]);
        }, 500);
      } else {
        setTimeout(() => setFlippedIndices([]), 1000);
      }
    }
  };

  if (vocabList.length === 0) return <div className="p-8 text-center">No words available.</div>;

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Well Done!</h2>
          <div className="text-xl font-medium text-slate-600 mb-6">Total Flips: {flipCount}</div>
          <button onClick={initializeGame} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /> Play Again</button>
          <button onClick={onBack} className="mt-4 w-full text-slate-500 py-3 hover:bg-slate-50 rounded-xl transition-colors">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
      <div className="bg-white p-4 flex justify-between items-center shadow-sm z-10">
        <button type="button" aria-label="Back to arcade menu" onClick={onBack} className="min-h-11 min-w-11 text-slate-500 hover:text-slate-800 flex items-center justify-center"><ArrowRight className="rotate-180 w-5 h-5"/></button>
        <div className="flex items-center gap-2 bg-purple-50 px-4 py-1 rounded-full"><Move className="w-4 h-4 text-purple-600" /><span className="font-mono font-bold text-purple-800">{flipCount}</span></div>
        <div className="w-5"></div>
      </div>
      {gamePhase === 'preview' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-800/80 text-white px-6 py-2 rounded-full font-bold backdrop-blur-sm animate-pulse">
              Memorize! {previewCount}s
          </div>
      )}
      <div className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-y-auto">
        <div className="grid grid-cols-4 gap-2 w-full max-w-lg">
          {cards.map((card, index) => {
            const isFlipped = flippedIndices.includes(index) || matchedIds.includes(card.id) || gamePhase === 'preview';
            const isMatched = matchedIds.includes(card.id);
            return (
              <button
                type="button"
                key={card.uniqueId}
                onClick={() => handleCardClick(index)}
                disabled={gamePhase !== 'playing' || isMatched}
                aria-label={isFlipped ? card.content : `Hidden memory card ${index + 1}`}
                className="relative cursor-pointer aspect-square perspective-1000 group disabled:cursor-default"
              >
                <div className={`w-full h-full transition-all duration-300 transform style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                  <div className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm backface-hidden flex items-center justify-center border-2 border-indigo-400"><Grid2X2 className="text-indigo-200 opacity-50 w-6 h-6" /></div>
                  <div className={`absolute inset-0 bg-white rounded-lg shadow-md backface-hidden flex items-center justify-center p-1 text-center border-2 ${isMatched ? 'border-green-400 bg-green-50' : 'border-purple-200'}`} style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                    <span className={`text-xs sm:text-sm font-semibold break-words leading-tight ${isMatched ? 'text-green-700' : 'text-slate-700'}`}>{card.content}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. SENTENCE BUILDER
const SentenceBuilder = ({ onBack, vocabList }) => {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [targetSentence, setTargetSentence] = useState(null);
  const [scrambledWords, setScrambledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [feedback, setFeedback] = useState(null); 
  const validSentences = useMemo(
    () => vocabList.filter(item => item.example && item.example.trim().split(/\s+/).length > 3),
    [vocabList]
  );

  useEffect(() => {
    if (validSentences.length === 0) return;
    const item = validSentences[currentSentenceIndex % validSentences.length];
    if (item) {
        const words = item.example.split(' ');
        setTargetSentence(item);
        setScrambledWords(shuffleArray(words.map((word, idx) => ({ id: idx, text: word }))));
        setSelectedWords([]);
        setFeedback(null);
    }
  }, [currentSentenceIndex, validSentences]);

  const handleWordClick = (word) => {
    if (feedback === 'correct') return;
    setScrambledWords(prev => prev.filter(w => w.id !== word.id));
    setSelectedWords(prev => [...prev, word]);
  };

  const handleUndo = (word) => {
    if (feedback === 'correct') return;
    setSelectedWords(prev => prev.filter(w => w.id !== word.id));
    setScrambledWords(prev => [...prev, word]);
  };

  const checkAnswer = () => {
    const currentString = selectedWords.map(w => w.text).join(' ');
    if (targetSentence && currentString === targetSentence.example) {
      setFeedback('correct');
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const nextSentence = () => {
    setCurrentSentenceIndex(prev => prev + 1);
  };

  if (validSentences.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">No practice sentences yet</h2>
        <p className="max-w-sm text-sm text-slate-600">Add an example sentence with at least four words to use Sentence Builder.</p>
        <button type="button" onClick={onBack} className="min-h-11 rounded-xl bg-slate-800 px-6 py-3 font-bold text-white">Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <button type="button" aria-label="Back to arcade menu" onClick={onBack} className="min-h-11 min-w-11 text-slate-600 flex items-center justify-center"><ArrowRight className="rotate-180 w-5 h-5"/></button>
        <span className="font-bold text-slate-700">Sentence Builder</span>
        <div className="w-5"></div>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto">
        <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 text-center">
          <p className="text-sm text-slate-500 uppercase font-bold mb-2">Build this sentence</p>
          <p className="text-xl text-indigo-900 italic">"{targetSentence?.english}"</p>
          {targetSentence && (
             <p className="mt-2 text-xs text-slate-400">Uses word: <span className="font-bold">{targetSentence.german}</span></p>
          )}
        </div>
        <div className={`w-full min-h-[120px] bg-slate-100 rounded-xl p-4 mb-6 flex flex-wrap gap-2 content-start transition-colors border-2 ${feedback === 'correct' ? 'border-green-400 bg-green-50' : feedback === 'wrong' ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}>
          {selectedWords.length === 0 && <span className="text-slate-400 w-full text-center mt-8 select-none">Tap words below to build</span>}
          {selectedWords.map(word => (
            <button key={word.id} onClick={() => handleUndo(word)} className="bg-white px-3 py-2 rounded-lg shadow-sm text-slate-800 font-medium hover:bg-red-50 hover:text-red-600 transition-colors animate-in fade-in zoom-in duration-200">
              {word.text}
            </button>
          ))}
        </div>
        <div className="h-8 mb-4">
          {feedback === 'wrong' && <span className="text-red-500 font-bold flex items-center gap-2"><XCircle className="w-4 h-4"/> Incorrect order</span>}
          {feedback === 'correct' && <span className="text-green-600 font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Correct! Well done!</span>}
        </div>
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {scrambledWords.map(word => (
            <button key={word.id} onClick={() => handleWordClick(word)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md font-medium hover:bg-indigo-700 active:transform active:scale-95 transition-all">
              {word.text}
            </button>
          ))}
        </div>
        <div className="mt-auto w-full">
          {feedback === 'correct' ? (
            <button onClick={nextSentence} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all flex justify-center items-center gap-2">Next Sentence <ArrowRight className="w-5 h-5"/></button>
          ) : (
            <button onClick={checkAnswer} disabled={scrambledWords.length > 0 || selectedWords.length === 0} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-all">Check Answer</button>
          )}
        </div>
      </div>
    </div>
  );
};

// 4. SPELLING BEE
const ArcadeSpellingInput = ({ card, onAnswer, langCode, targetLanguage }) => {
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const specialCharacters = getSpecialCharacters(targetLanguage);
  
    const check = () => {
      const cleanInput = input.trim().toLowerCase().replace(/\s/g, '');
      const cleanTarget = card.german.toLowerCase().replace(/\s/g, '');
      const correct = cleanInput === cleanTarget;
      setIsCorrect(correct);
      setChecked(true);
      speak(card.german, langCode); 
      setTimeout(() => {
          onAnswer(correct);
          setInput('');
          setChecked(false);
      }, 2000);
    };
  
    return (
      <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="text-sm uppercase text-teal-500 font-bold mb-2 tracking-wider">Spelling</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 italic">"{card.english}"</h2>
        <div className="relative w-full max-w-md">
            <input autoFocus value={input} disabled={checked} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !checked && input.trim() && check()} aria-label={card.partOfSpeech === 'noun' ? `Type the ${targetLanguage} article and noun` : `Type the ${targetLanguage} translation`} className={`w-full p-4 text-center text-xl border-2 rounded-xl outline-none mb-4 transition-all ${checked ? isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 focus:border-teal-500'}`} placeholder={card.partOfSpeech === 'noun' ? `Type article + noun in ${targetLanguage}...` : `Type in ${targetLanguage}...`} />
            {checked && <div className={`absolute right-4 top-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{isCorrect ? <CheckCircle className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}</div>}
        </div>
        {checked && !isCorrect && <div className="text-red-500 font-bold mb-4 animate-in fade-in">Correct: {card.german}</div>}
        {!checked && <div className="flex flex-wrap justify-center gap-2 mb-6">{specialCharacters.map(char => (<button type="button" aria-label={`Insert ${char}`} key={char} onClick={() => setInput(prev => prev + char)} className="min-w-11 min-h-11 bg-white border shadow-sm rounded hover:bg-slate-50 font-medium">{char}</button>))}</div>}
        {!checked && <button onClick={check} disabled={!input.trim()} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg disabled:cursor-not-allowed disabled:opacity-50">Check</button>}
      </div>
    );
  };

const ArcadeSpellingBee = ({ onBack, vocabList, onUpdateItem, langCode, targetLanguage }) => {
    const [score, setScore] = useState(0);
    const [card, setCard] = useState(null);
    const [turnCount, setTurnCount] = useState(0); 

    const next = useCallback(() => { 
        setCard(vocabList[Math.floor(Math.random() * vocabList.length)]);
        setTurnCount(c => c + 1); 
    }, [vocabList]);

    useEffect(() => { if(!card && vocabList.length > 0) next(); }, [card, next, vocabList]);

    const handleAnswer = (correct) => {
        if(correct) {
            setScore(s => s + 20);
            onUpdateItem({ ...card, familiarity: Math.min(5, (card.familiarity || 0) + 1) });
        }
        next();
    };

    if (vocabList.length === 0) return <div className="p-8 text-center">No words available.</div>;
    if (!card) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 flex justify-between items-center">
                <button type="button" aria-label="Back to arcade menu" onClick={onBack} className="min-h-11 min-w-11 flex items-center justify-center"><ArrowRight className="rotate-180 w-6 h-6"/></button>
                <div className="font-bold text-teal-600">Score: {score}</div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                {/* Use combined Key to force re-render on every turn */}
                <ArcadeSpellingInput key={`${card.id}-${turnCount}`} card={card} onAnswer={handleAnswer} langCode={langCode} targetLanguage={targetLanguage}/>
            </div>
        </div>
    );
}

const ArcadeContainer = ({ gameType, vocabList, onBack, onUpdateItem, langCode, targetLanguage }) => {
    const [config, setConfig] = useState(null);
    if (!config) {
        let title = "Arcade";
        if (gameType === 'blitz') title = "Blitz";
        if (gameType === 'reverse-blitz') title = "Reverse Blitz";
        if (gameType === 'listening') title = "Listening Challenge";
        if (gameType === 'memory') title = "Memory";
        if (gameType === 'sentence') title = "Sentence Builder";
        if (gameType === 'spelling') title = "Spelling Bee";
        return <ArcadeConfig title={title} onStart={setConfig} onBack={onBack} vocabList={vocabList} />;
    }
    
    let playableList = vocabList.filter(i => !i.isDeleted);
    
    if (config === 'starred') { playableList = playableList.filter(w => w.isStarred); }
    if (playableList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h2 className="text-xl font-bold mb-4">No words found!</h2>
                <p className="mb-6">You selected "Favorites Only" but you haven't starred any words yet.</p>
                <button onClick={() => setConfig(null)} className="bg-slate-800 text-white px-6 py-2 rounded-lg">Go Back</button>
            </div>
        );
    }
    switch(gameType) {
        case 'blitz': return <FlashcardGame vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} langCode={langCode} />;
        case 'reverse-blitz': return <ReverseBlitzGame vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} langCode={langCode} targetLanguage={targetLanguage} />;
        case 'listening': return <ArcadeListeningGame vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} langCode={langCode} />;
        case 'memory': return <MemoryMatchGame vocabList={playableList} onBack={onBack} />;
        case 'sentence': return <SentenceBuilder vocabList={playableList} onBack={onBack} />;
        case 'spelling': return <ArcadeSpellingBee vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} langCode={langCode} targetLanguage={targetLanguage} />;
        default: return <div>Unknown Game</div>;
    }
};

// --- VOCAB BROWSER ---
const VocabBrowser = ({ onBack, vocabList, onUpdateItem, onAddItem, onDeleteItem, initialFilter = 'all', currentLanguage, langCode }) => { // Added currentLanguage
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newWord, setNewWord] = useState(EMPTY_VOCAB_FORM);
  const [newWordErrors, setNewWordErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Use the passed language or default to German
  const targetLangLabel = currentLanguage || "German";
  const isGermanDeck = targetLangLabel.trim().toLowerCase() === 'german'
    || langCode?.toLowerCase().startsWith('de');

  const filtered = vocabList.filter(item => {
      if (item.isDeleted) return false; 
      
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          const matches = item.german.toLowerCase().includes(lower) || 
                          item.english.toLowerCase().includes(lower) || 
                          (item.example && item.example.toLowerCase().includes(lower));
          if (!matches) return false;
      }

      if (filter === 'all') return true;
      if (filter === 'starred') return item.isStarred;
      if (String(filter).startsWith('status-')) return item.status === parseInt(filter.split('-')[1]);
      if (filter === 'nigate') return item.isNigate;
      return item.partOfSpeech === filter;
  });

  const analyzeNounForm = (form) => (
    form.partOfSpeech === 'noun'
      ? parseNounEntry(form.german, targetLangLabel)
      : null
  );

  const validateForm = (form) => {
    const result = validateVocabInput({
      target: form.german,
      translation: form.english,
      example: form.example,
      partOfSpeech: form.partOfSpeech || 'other'
    });
    const errors = { ...result.errors };
    const parsedNoun = analyzeNounForm({
      german: result.value.target,
      partOfSpeech: result.value.partOfSpeech,
    });

    if (parsedNoun) {
      const nounError = parsedNoun.errors.article
        || parsedNoun.errors.noun
        || parsedNoun.errors.target;
      if (nounError) errors.target = errors.target || nounError;
    }

    return {
      value: {
        ...form,
        german: parsedNoun?.value.target ?? result.value.target,
        english: result.value.translation,
        example: result.value.example,
        article: parsedNoun?.value.article || '',
        grammaticalGender: parsedNoun?.value.grammaticalGender || null,
        partOfSpeech: result.value.partOfSpeech,
      },
      errors
    };
  };

  const newNounAnalysis = analyzeNounForm(newWord);
  const editNounAnalysis = analyzeNounForm(editForm);
  const detectedGenderLabel = (analysis) => (
    analysis && Object.keys(analysis.errors).length === 0
      ? GRAMMATICAL_GENDER_LABELS[analysis.value.grammaticalGender]
      : null
  );

  const saveEdit = () => {
    const { value, errors } = validateForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onUpdateItem({ ...value, isCustomized: true });
    setEditingId(null);
  };

  const saveNew = () => {
    const { value, errors } = validateForm(newWord);
    setNewWordErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onAddItem(value);
    setIsAdding(false);
    setNewWord(EMPTY_VOCAB_FORM);
    setNewWordErrors({});
  };
  const getStatusColor = (status) => {
      switch(status) {
          case STATUS.MASTERED: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
          case STATUS.DRIFTING: return 'text-orange-600 bg-orange-50 border-orange-200';
          case STATUS.REVIEW: return 'text-green-600 bg-green-50 border-green-200';
          case STATUS.LEARNING: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
          default: return 'text-slate-500 bg-slate-100 border-slate-200';
      }
  };
  const getFilterLabel = (key) => {
    if (key.startsWith('status-')) return STATUS_LABELS[key.split('-')[1]];
    if (key === 'nigate') return 'NIGATE';
    return PART_OF_SPEECH_LABELS[key] || key;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
        <div className="p-4 bg-white shadow-sm sticky top-0 z-10 space-y-3">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-slate-600 flex items-center gap-2 font-medium"><ArrowRight className="rotate-180 w-5 h-5"/> Back</button>
                <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/> Add Word</button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    aria-label={`Search ${targetLangLabel} vocabulary`}
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder={`Search ${targetLangLabel} vocabulary...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'starred', 'nigate', `status-${STATUS.NEW}`, `status-${STATUS.LEARNING}`, `status-${STATUS.REVIEW}`, `status-${STATUS.DRIFTING}`, `status-${STATUS.MASTERED}`, ...Object.keys(PART_OF_SPEECH_LABELS)].map(type => (
                <button key={type} onClick={() => setFilter(type)} className={`px-4 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap flex items-center gap-1 ${filter === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {type === 'starred' && <Star className="w-3 h-3 fill-current"/>}
                  {type === 'nigate' && <Skull className="w-3 h-3"/>}
                  {getFilterLabel(type)}
                </button>
              ))}
            </div>
            {isAdding && (
                <div role="group" aria-labelledby="add-word-title" className="bg-white p-4 rounded-xl shadow-md border-2 border-indigo-500 mb-4 animate-in fade-in zoom-in">
                    <h2 id="add-word-title" className="font-bold text-slate-800 mb-3">Add vocabulary</h2>
                    {Object.keys(newWordErrors).length > 0 && <p role="alert" className="mb-3 text-sm font-bold text-red-600">Please fix the highlighted fields.</p>}
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                        <label className="sr-only" htmlFor="new-word-target">{targetLangLabel} word</label>
                        <input
                          id="new-word-target"
                          required
                          aria-invalid={Boolean(newWordErrors.target)}
                          aria-describedby={[
                            newWord.partOfSpeech === 'noun' && isGermanDeck ? 'new-word-noun-hint' : null,
                            newWordErrors.target ? 'new-word-target-error' : null,
                          ].filter(Boolean).join(' ') || undefined}
                          className="min-w-0 flex-1 p-2 border rounded font-bold"
                          placeholder={newWord.partOfSpeech === 'noun' && isGermanDeck ? 'der Mann' : `${targetLangLabel} word`}
                          value={newWord.german}
                          onChange={e => setNewWord({...newWord, german: e.target.value})}
                        />
                        <label className="sr-only" htmlFor="new-word-part">Part of speech</label>
                        <select id="new-word-part" className="p-2 border rounded" value={newWord.partOfSpeech} onChange={e => setNewWord({...newWord, partOfSpeech: e.target.value})}>
                          {PART_OF_SPEECH_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </div>
                    {newWord.partOfSpeech === 'noun' && isGermanDeck && (
                      <p id="new-word-noun-hint" className="mb-2 text-xs text-slate-600">Enter the article and noun together. The app uses der, die, or das to classify its gender.</p>
                    )}
                    {detectedGenderLabel(newNounAnalysis) && (
                      <p role="status" aria-live="polite" className="mb-2 text-xs font-bold text-indigo-600">Detected gender: {detectedGenderLabel(newNounAnalysis)}</p>
                    )}
                    {newWordErrors.target && <p id="new-word-target-error" className="mb-2 text-xs font-bold text-red-600">{newWordErrors.target}</p>}
                    <label className="sr-only" htmlFor="new-word-translation">English or native translation</label>
                    <input id="new-word-translation" required aria-invalid={Boolean(newWordErrors.translation)} className="w-full p-2 border rounded mb-2" placeholder="English / Native" value={newWord.english} onChange={e => setNewWord({...newWord, english: e.target.value})} />
                    <label className="sr-only" htmlFor="new-word-example">Example sentence</label>
                    <input id="new-word-example" required aria-invalid={Boolean(newWordErrors.example)} className="w-full p-2 border rounded mb-2" placeholder="Example Sentence" value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} />
                    <div className="flex gap-2">
                        <button onClick={saveNew} className="flex-1 bg-green-500 text-white p-2 rounded font-bold">Save</button>
                        <button onClick={() => { setIsAdding(false); setNewWordErrors({}); }} className="flex-1 bg-slate-200 text-slate-600 p-2 rounded font-bold">Cancel</button>
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {filtered.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group">
                        {editingId === item.id ? (
                            <div className="space-y-2">
                                {Object.keys(editErrors).length > 0 && <p role="alert" className="text-sm font-bold text-red-600">Please fix the highlighted fields.</p>}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <label className="sr-only" htmlFor={`edit-target-${item.id}`}>{targetLangLabel} word</label>
                                    <input
                                      id={`edit-target-${item.id}`}
                                      required
                                      aria-invalid={Boolean(editErrors.target)}
                                      aria-describedby={[
                                        editForm.partOfSpeech === 'noun' && isGermanDeck ? `edit-noun-hint-${item.id}` : null,
                                        editErrors.target ? `edit-target-error-${item.id}` : null,
                                      ].filter(Boolean).join(' ') || undefined}
                                      className="min-w-0 flex-1 font-bold border-b"
                                      placeholder={editForm.partOfSpeech === 'noun' && isGermanDeck ? 'der Mann' : `${targetLangLabel} word`}
                                      value={editForm.german}
                                      onChange={e => setEditForm({...editForm, german: e.target.value})}
                                    />
                                    <label className="sr-only" htmlFor={`edit-part-${item.id}`}>Part of speech</label>
                                    <select id={`edit-part-${item.id}`} className="border-b bg-white" value={editForm.partOfSpeech || 'other'} onChange={e => setEditForm({...editForm, partOfSpeech: e.target.value})}>
                                      {PART_OF_SPEECH_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                </div>
                                {editForm.partOfSpeech === 'noun' && isGermanDeck && (
                                  <p id={`edit-noun-hint-${item.id}`} className="text-xs text-slate-600">Keep der, die, or das in this same field; it determines the grammatical gender.</p>
                                )}
                                {detectedGenderLabel(editNounAnalysis) && (
                                  <p role="status" aria-live="polite" className="text-xs font-bold text-indigo-600">Detected gender: {detectedGenderLabel(editNounAnalysis)}</p>
                                )}
                                {editErrors.target && <p id={`edit-target-error-${item.id}`} className="text-xs font-bold text-red-600">{editErrors.target}</p>}
                                <label className="sr-only" htmlFor={`edit-translation-${item.id}`}>English or native translation</label>
                                <input id={`edit-translation-${item.id}`} required aria-invalid={Boolean(editErrors.translation)} className="w-full border-b" value={editForm.english} onChange={e => setEditForm({...editForm, english: e.target.value})}/>
                                <label className="sr-only" htmlFor={`edit-example-${item.id}`}>Example sentence</label>
                                <textarea id={`edit-example-${item.id}`} required aria-invalid={Boolean(editErrors.example)} className="w-full border p-1 rounded" value={editForm.example} onChange={e => setEditForm({...editForm, example: e.target.value})}/>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => { setEditingId(null); setEditErrors({}); }} className="text-slate-500">Cancel</button>
                                    <button onClick={saveEdit} className="text-indigo-600 font-bold">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span lang={langCode} className="font-bold text-slate-800 text-lg break-words">{item.german}</span>
                                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{getVocabularyTypeLabel(item)}</span>
                                        <button aria-label={`Play pronunciation for ${item.german}`} onClick={() => speak(item.german, langCode)} className="min-h-11 min-w-11 text-slate-500 hover:text-indigo-600 ml-1 flex items-center justify-center"><Volume2 className="w-4 h-4"/></button>
                                        {item.isNigate && <Skull className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="text-slate-500 mb-2">{item.english}</div>
                                    <div lang={langCode} className="text-xs text-slate-600 italic mb-2 break-words">"{item.example}"</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>{STATUS_LABELS[item.status]}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 absolute top-4 right-4">
                                    <button aria-label={`Edit ${item.german}`} onClick={() => { setEditingId(item.id); setEditForm(item); setEditErrors({}); }} className="min-h-11 min-w-11 text-slate-500 hover:text-indigo-500 flex items-center justify-center"><Pencil className="w-4 h-4"/></button>
                                    <button aria-label={`${item.isStarred ? 'Remove' : 'Add'} ${item.german} ${item.isStarred ? 'from' : 'to'} favorites`} onClick={() => onUpdateItem({ ...item, isStarred: !item.isStarred })} className={`min-h-11 min-w-11 flex items-center justify-center ${item.isStarred ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}><Star className="w-4 h-4 fill-current"/></button>
                                    {confirmDeleteId === item.id ? (
                                        <button onClick={() => { onDeleteItem(item.id); setConfirmDeleteId(null); }} className="text-xs bg-red-500 text-white px-2 py-1 rounded shadow-sm hover:bg-red-600 animate-in zoom-in">Confirm</button>
                                    ) : (
                                        <button aria-label={`Delete ${item.german}`} onClick={() => setConfirmDeleteId(item.id)} className="min-h-11 min-w-11 text-slate-400 hover:text-red-500 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-bold text-slate-700">No vocabulary matches this view.</p>
                <button type="button" onClick={() => { setFilter('all'); setSearchTerm(''); }} className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white">Clear filters</button>
              </div>
            )}
        </div>
    </div>
  );
};

// --- DASHBOARD (Strictly Defined Before App) ---
// --- DASHBOARD (修改版：加入 Google 登入) ---
const Dashboard = ({ vocabList, onStartMode, onOpenVocab, user, currentLanguage, onSwitchDeck, onLogin, onLogout }) => {
  // 計算統計數據
  const stats = {
      new: vocabList.filter(i => i.status === STATUS.NEW && !i.isDeleted).length,
      learning: vocabList.filter(i => i.status === STATUS.LEARNING && !i.isDeleted).length,
      review: vocabList.filter(i => i.status === STATUS.REVIEW && !i.isDeleted).length,
      drifting: vocabList.filter(i => i.status === STATUS.DRIFTING && !i.isDeleted).length,
      mastered: vocabList.filter(i => i.status === STATUS.MASTERED && !i.isDeleted).length,
      nigate: vocabList.filter(i => i.isNigate && !i.isDeleted).length
  };
  const totalWords = stats.new + stats.learning + stats.review + stats.drifting + stats.mastered;

  

  // 取得目前語言的旗幟
  const currentFlag = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.flag || '🇩🇪';

  return (
      <div className="flex flex-col h-full bg-slate-50">
          <div className="bg-indigo-700 p-6 pb-12 rounded-b-[2.5rem] shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Languages className="w-32 h-32" /></div>
              
              {/* Header Navigation */}
              <div className="flex justify-between items-start relative z-10 mb-6">
                  <div className="flex items-center gap-3">
                      {/* Switch Deck Button */}
                      <button 
                        onClick={onSwitchDeck}
                        className="bg-indigo-600/50 hover:bg-indigo-600 backdrop-blur-sm p-2 rounded-xl border border-indigo-500/50 transition-all flex flex-col items-center justify-center min-w-[50px]"
                      >
                         <span className="text-2xl leading-none mb-1">{currentFlag}</span>
                         <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">Switch</span>
                      </button>
                      
                      <div>
                          <h1 className="text-2xl font-extrabold tracking-tight">DuanLingo</h1>
                          <p className="text-indigo-200 text-sm font-medium opacity-80">
                            {currentLanguage || 'German'}
                          </p>
                      </div>
                  </div>

                  {/* User Profile / Login */}
                  <div>
                      {user && !user.isAnonymous ? (
                          <button type="button" aria-label="Switch account or log out" onClick={onLogout} className="group relative min-h-11 min-w-11 flex items-center justify-center">
                              <img 
                                src={user.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}`}
                                alt="User"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-indigo-100" 
                              />
                          </button>
                      ) : (
                          <button onClick={onLogin} className="bg-white text-indigo-700 hover:bg-indigo-50 text-xs px-4 py-2 rounded-full font-bold shadow-md transition-colors flex items-center gap-2">
                              Login
                          </button>
                      )}
                  </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-2 grid grid-cols-3 gap-2 relative z-10">
                  <button onClick={() => onOpenVocab(`status-${STATUS.NEW}`)} className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-center hover:bg-white/20 transition-colors"><div className="flex justify-center mb-1 text-indigo-200"><CircleDashed className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.new}</span><span className="text-[10px] uppercase tracking-wider opacity-70">New</span></button>
                  <button onClick={() => onOpenVocab(`status-${STATUS.LEARNING}`)} className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-center border border-indigo-400 hover:bg-white/20 transition-colors"><div className="flex justify-center mb-1 text-white"><BookOpen className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.learning}</span><span className="text-[10px] uppercase tracking-wider opacity-70">Learning</span></button>
                  <button onClick={() => onOpenVocab(`status-${STATUS.REVIEW}`)} className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-center hover:bg-white/20 transition-colors"><div className="flex justify-center mb-1 text-green-300"><CheckCircle className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.review}</span><span className="text-[10px] uppercase tracking-wider opacity-70">Short Term</span></button>
                  <button onClick={() => onOpenVocab(`status-${STATUS.DRIFTING}`)} className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-center hover:bg-white/20 transition-colors"><div className="flex justify-center mb-1 text-orange-300"><TrendingDown className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.drifting}</span><span className="text-[10px] uppercase tracking-wider opacity-70">Drifting</span></button>
                  <button onClick={() => onOpenVocab(`status-${STATUS.MASTERED}`)} className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-center hover:bg-white/20 transition-colors"><div className="flex justify-center mb-1 text-yellow-300"><Trophy className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.mastered}</span><span className="text-[10px] uppercase tracking-wider opacity-70">Mastered</span></button>
                  <button onClick={() => onOpenVocab('nigate')} className="bg-red-500/20 backdrop-blur-md p-2 rounded-xl text-center border border-red-500/30 hover:bg-red-500/30 transition-colors"><div className="flex justify-center mb-1 text-red-300"><Skull className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.nigate}</span><span className="text-[10px] uppercase tracking-wider opacity-80">NIGATE</span></button>
              </div>
          </div>
          
          {/* Main Action Buttons */}
          <div className="flex-1 p-6 -mt-4 overflow-y-auto space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Core Path</div>
              {totalWords === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-5 text-center">
                  <h2 className="font-bold text-indigo-900">Add your first word</h2>
                  <p className="mt-1 text-sm text-indigo-700">Create vocabulary before starting a lesson or arcade game.</p>
                  <button type="button" onClick={() => onStartMode('vocab')} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white">Open Vocabulary Manager</button>
                </div>
              )}
              <button onClick={() => onStartMode('learning')} disabled={stats.new + stats.learning === 0} className="w-full bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-100 flex items-center gap-4 disabled:opacity-50">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
                  <div className="text-left flex-1"><h3 className="font-bold text-slate-800">Learning Mode</h3><p className="text-slate-500 text-xs">Learn new words & promote</p></div>
                  <ArrowRight className="text-slate-300 w-5 h-5" />
              </button>
              <button onClick={() => onStartMode('review')} disabled={stats.drifting === 0} className="w-full bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-100 flex items-center gap-4 disabled:opacity-50">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><RotateCcw className="w-5 h-5 text-orange-600" /></div>
                  <div className="text-left flex-1"><h3 className="font-bold text-slate-800">Review Mode</h3><p className="text-slate-500 text-xs">Recover drifting words</p></div>
                  <ArrowRight className="text-slate-300 w-5 h-5" />
              </button>
              
              {/* (其餘 Arcade Buttons 維持不變，篇幅關係這邊省略，請保留原有的按鈕程式碼) */}
               {stats.nigate > 0 && (
                  <button onClick={() => onStartMode('hell')} className="w-full bg-gradient-to-r from-red-50 to-red-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-red-200 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center"><Flame className="w-6 h-6 text-red-600 animate-pulse" /></div>
                      <div className="text-left flex-1"><h3 className="font-bold text-red-800">Hell Training</h3><p className="text-red-700 text-xs">Clear your NIGATE words</p></div>
                      <ArrowRight className="text-red-300 w-5 h-5" />
                  </button>
              )}
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mt-6">Arcade & Tools</div>
              <div className="grid grid-cols-2 gap-3">
                  <button disabled={totalWords === 0} onClick={() => onStartMode('arcade-blitz')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Clock className="w-6 h-6 text-blue-500" />
                      <span className="font-bold text-slate-700 text-sm">Blitz</span>
                  </button>
                  <button disabled={totalWords === 0} onClick={() => onStartMode('arcade-reverse-blitz')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Shuffle className="w-6 h-6 text-pink-500" />
                      <span className="font-bold text-slate-700 text-sm">Rev. Blitz</span>
                  </button>
                  <button disabled={totalWords === 0} onClick={() => onStartMode('arcade-listening')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Headphones className="w-6 h-6 text-red-500" />
                      <span className="font-bold text-slate-700 text-sm">Listening</span>
                  </button>
                  <button disabled={totalWords === 0} onClick={() => onStartMode('arcade-memory')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Grid2X2 className="w-6 h-6 text-purple-500" />
                      <span className="font-bold text-slate-700 text-sm">Memory</span>
                  </button>
                  <button disabled={totalWords === 0} onClick={() => onStartMode('arcade-sentence')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Brain className="w-6 h-6 text-orange-500" />
                      <span className="font-bold text-slate-700 text-sm">Sentence</span>
                  </button>
                  <button disabled={totalWords === 0} onClick={() => onStartMode('arcade-spelling')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Keyboard className="w-6 h-6 text-teal-500" />
                      <span className="font-bold text-slate-700 text-sm">Spelling</span>
                  </button>
                  <button onClick={() => onStartMode('vocab')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2 col-span-2">
                      <ListChecks className="w-6 h-6 text-emerald-500" />
                      <span className="font-bold text-slate-700 text-sm">Vocabulary Manager</span>
                  </button>
              </div>

          </div>
      </div>
  );
};

// --- CONSTANTS: Supported Languages ---
const SUPPORTED_LANGUAGES = [
  { code: 'German', label: 'German (Deutsch)', flag: '🇩🇪', color: 'bg-yellow-500', speechCode: 'de-DE' },
  { code: 'Spanish', label: 'Spanish (Español)', flag: '🇪🇸', color: 'bg-orange-500', speechCode: 'es-ES' },
  { code: 'Italian', label: 'Italian (Italiano)', flag: '🇮🇹', color: 'bg-green-600', speechCode: 'it-IT' },
  { code: 'French', label: 'French (Français)', flag: '🇫🇷', color: 'bg-blue-600', speechCode: 'fr-FR' },
  { code: 'Dutch', label: 'Dutch (Nederlands)', flag: '🇳🇱', color: 'bg-orange-400', speechCode: 'nl-NL' },
  { code: 'Russian', label: 'Russian (Русский)', flag: '🇷🇺', color: 'bg-red-600', speechCode: 'ru-RU' },
  { code: 'Polish', label: 'Polish (Polski)', flag: '🇵🇱', color: 'bg-rose-500', speechCode: 'pl-PL' },
  { code: 'Czech', label: 'Czech (Čeština)', flag: '🇨🇿', color: 'bg-blue-600', speechCode: 'cs-CZ' },
  { code: 'Swedish', label: 'Swedish (Svenska)', flag: '🇸🇪', color: 'bg-blue-500', speechCode: 'sv-SE' }
];

// --- NEW COMPONENT: Deck Library (The Menu Page) ---
// 修改原本的 DeckLibrary 元件
// 加入 user, onLogin, onLogout 這三個新的 props
// --- 修改後的 DeckLibrary (舊風格 + 刪除功能) ---
const DeckLibrary = ({ decks, onSelectDeck, onAddDeck, onDeleteDeck, user, onLogin, onLogout }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckData, setNewDeckData] = useState({ title: '', language: 'German' });
  const [loadDefault, setLoadDefault] = useState(true);
  const [createError, setCreateError] = useState('');
  const createTriggerRef = useRef(null);

  const closeCreateDialog = useCallback(() => {
    setIsCreating(false);
    setCreateError('');
    window.requestAnimationFrame(() => createTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isCreating) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeCreateDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCreateDialog, isCreating]);

  const handleCreate = () => {
    const title = newDeckData.title.trim();
    if (!title) {
      setCreateError('Deck name is required.');
      return;
    }
    onAddDeck(title, newDeckData.language, loadDefault);
    closeCreateDialog();
    setNewDeckData({ title: '', language: 'German' });
    setLoadDefault(true);
  };

  const getLangInfo = (langCode) => SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* 1. Header (保持原本的深色圓弧設計) */}
      <div className="bg-slate-900 text-white p-8 pt-12 pb-16 rounded-b-[3rem] shadow-xl relative z-10 flex flex-col items-center">
         
         {/* User Profile Section */}
         <div className="mb-4 flex min-h-11 w-full justify-end">
            {user && !user.isAnonymous ? (
                <div className="flex items-center gap-3 bg-slate-800 p-1.5 pl-3 rounded-full border border-slate-700">
                    <div className="text-xs text-slate-300 font-medium">
                        {user.displayName?.split(' ')[0] || 'User'}
                    </div>
                    <button 
                        onClick={onLogout}
                        className="bg-slate-700 hover:bg-slate-600 text-xs px-3 py-1.5 rounded-full transition-colors font-bold text-slate-200"
                    >
                        Switch / Logout
                    </button>
                    <img 
                        src={user.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}`} 
                        alt="User" 
                        className="w-8 h-8 rounded-full border-2 border-slate-600"
                    />
                </div>
            ) : (
                <button 
                    onClick={onLogin}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg transition-all flex items-center gap-2"
                >
                    Login to Sync
                </button>
            )}
         </div>

         <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Your Library</h1>
         <p className="text-slate-300">Select a language deck to start learning</p>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
          {/* Create New Deck Button */}
          <button 
            ref={createTriggerRef}
            onClick={() => setIsCreating(true)}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-50 hover:border-indigo-400 transition-all group"
          >
            <div className="bg-indigo-100 p-3 rounded-full group-hover:bg-indigo-200 transition-colors">
                <Plus className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="font-bold text-slate-600 group-hover:text-indigo-700">Create New Deck</span>
          </button>

          {/* Existing Decks (Modified with Delete) */}
          {Object.values(decks).map(deck => {
            const langInfo = getLangInfo(deck.language);
            const wordCount = deck.words ? deck.words.filter(w => !w.isDeleted).length : 0;
            const masteredCount = deck.words ? deck.words.filter(w => w.status === STATUS.MASTERED && !w.isDeleted).length : 0;
            
            return (
              <article
                key={deck.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all text-left relative overflow-hidden group"
              >
                <button 
                    type="button"
                    aria-label={`Delete ${deck.title}`}
                    onClick={() => onDeleteDeck(deck.id)}
                    className="absolute top-3 right-3 z-30 min-h-11 min-w-11 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    title="Delete Deck"
                >
                    <Trash2 className="w-5 h-5" />
                </button>

                <button type="button" onClick={() => onSelectDeck(deck.id)} className="w-full p-5 pr-14 text-left">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="text-4xl shadow-sm rounded-lg overflow-hidden">{langInfo.flag}</div>
                    <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg pr-6">{deck.title}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{langInfo.label}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> {wordCount} words</span>
                        <span className="flex items-center gap-1 text-yellow-600"><Trophy className="w-3 h-3" /> {masteredCount} mastered</span>
                    </div>
                    </div>
                    <ArrowRight className="text-slate-300 w-5 h-5 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* Create Modal (保持不變) */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="new-deck-title" className="bg-white text-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in
                max-h-[90vh] overflow-y-auto">
            <h3 id="new-deck-title" className="text-xl font-bold mb-6 flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-lg"><Plus className="w-5 h-5 text-indigo-600" /></div>
                New Language Deck
            </h3>
            
            <fieldset>
            <legend className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">Select Language</legend>
            <div className="grid grid-cols-2 gap-2 mb-6" role="radiogroup">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        type="button"
                        role="radio"
                        aria-checked={newDeckData.language === lang.code}
                        onClick={() => setNewDeckData({...newDeckData, language: lang.code})}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${newDeckData.language === lang.code ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                    >
                        <div className="text-2xl mb-1">{lang.flag}</div>
                        <div className={`text-xs font-bold ${newDeckData.language === lang.code ? 'text-indigo-700' : 'text-slate-600'}`}>{lang.code}</div>
                    </button>
                ))}
            </div>
            </fieldset>

            <label htmlFor="deck-name" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">Deck Name</label>
            <input 
              id="deck-name"
              autoFocus
              required
              aria-invalid={Boolean(createError)}
              className="w-full p-4 bg-slate-50 rounded-xl mb-6 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              placeholder="e.g. Travel Basics..."
              value={newDeckData.title}
              onChange={e => setNewDeckData({...newDeckData, title: e.target.value})}
            />
            {createError && <p role="alert" className="-mt-4 mb-5 text-sm font-bold text-red-600">{createError}</p>}

            <label className="flex items-center gap-3 mb-6 ml-1 cursor-pointer text-sm font-bold text-slate-700">
                <input type="checkbox" checked={loadDefault} onChange={event => setLoadDefault(event.target.checked)} className="h-5 w-5 accent-indigo-600" />
                Load starter vocabulary (15 words)
            </label>

            <div className="flex gap-3">
              <button onClick={closeCreateDialog} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all transform active:scale-95">Create Deck</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PENDING_AUTH_MERGE_KEY = 'duanlingo_pending_auth_merge_v1';

const readPendingAuthMerge = () => {
  try {
    const rawValue = window.localStorage.getItem(PENDING_AUTH_MERGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

const writePendingAuthMerge = (value) => {
  window.localStorage.setItem(PENDING_AUTH_MERGE_KEY, JSON.stringify(value));
};

const clearPendingAuthMerge = () => {
  window.localStorage.removeItem(PENDING_AUTH_MERGE_KEY);
};

const getUserDataRef = (uid) => doc(db, 'users', uid, 'data', STORAGE_KEY);

const withTimeout = (promise, timeoutMs, message) => new Promise((resolve, reject) => {
  const timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  Promise.resolve(promise).then(
    value => {
      window.clearTimeout(timeoutId);
      resolve(value);
    },
    error => {
      window.clearTimeout(timeoutId);
      reject(error);
    }
  );
});



// --- APP ROOT (COMPLETE REWRITE) ---
// --- APP ROOT (COMPLETE REWRITE) ---
// --- APP ROOT (COMPLETE REWRITE) ---
const App = () => {
  // Start in 'home' or 'decks' depending on preference. 'home' defaults to the last active deck.
  const [view, setView] = useState('decks');
  
  // [Core State Change] 'decks' replaces the original 'vocabList'
  const [decks, setDecks] = useState({});
  const [currentDeckId, setCurrentDeckId] = useState(null);
  
  // [Derived State] Dynamically calculated so child components still see a single list
  const currentDeck = decks[currentDeckId] || Object.values(decks)[0] || EMPTY_DECK;
  const currentSpeechCode = SUPPORTED_LANGUAGES.find(l => l.code === currentDeck.language)?.speechCode || 'de-DE';
  const vocabList = currentDeck.words || [];

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVideoDone, setIsVideoDone] = useState(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  );
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [authError, setAuthError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [syncEpoch, setSyncEpoch] = useState(0);
  const [pendingAuthMerge, setPendingAuthMerge] = useState(readPendingAuthMerge);
  const [mergeError, setMergeError] = useState('');
  const [vocabFilter, setVocabFilter] = useState('all');

  const decksRef = useRef(decks);
  const authMergeRef = useRef(false);
  const authActionRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());
  const pendingSaveCountRef = useRef(0);
  const failedSaveRef = useRef(null);
  const saveRevisionRef = useRef(0);
  const deferredSnapshotRef = useRef(null);
  useEffect(() => { decksRef.current = decks; }, [decks]);

  useEffect(() => {
    if (isVideoDone) return undefined;
    const timeout = window.setTimeout(() => setIsVideoDone(true), 7000);
    return () => window.clearTimeout(timeout);
  }, [isVideoDone]);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!active) return;
      if (currentUser) {
        if (pendingAuthMerge) authMergeRef.current = true;
        setAuthError('');
        setUser(currentUser);
        setAuthReady(true);
      } else {
        setUser(null);
        if (pendingAuthMerge) {
          authMergeRef.current = true;
          setAuthReady(true);
          setLoading(false);
          return;
        }
        setAuthReady(false);
        signInAnonymously(auth).catch(error => {
          if (!active) return;
          setAuthError(`Unable to start a guest session: ${error.message}`);
          setLoading(false);
        });
      }
    }, error => {
      if (!active) return;
      setAuthError(`Authentication failed: ${error.message}`);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [pendingAuthMerge]);

  // 2. Core Data Sync & Migration Logic (Smart Auto-Restore)
  // [Logic] Checks if v8 (new) data is empty. If so, forces a check for v7 (old) data to auto-migrate.
  // 2. Core Data Sync & Migration Logic (Smart Auto-Restore)
  
  useEffect(() => {
    if (!authReady || !user || authMergeRef.current) return undefined;

    setLoading(true);
    setCloudLoaded(false);
    setSyncError('');
    const expectedUid = user.uid;
    let receivedFirstSnapshot = false;
    const loadTimeout = window.setTimeout(() => {
      if (receivedFirstSnapshot || auth.currentUser?.uid !== expectedUid) return;
      setSyncError('Cloud loading timed out. Check your connection and try again.');
      setCloudLoaded(false);
      setLoading(false);
    }, 12000);

    const unsubscribe = onSnapshot(
      getUserDataRef(expectedUid),
      (docSnap) => {
        if (authMergeRef.current || auth.currentUser?.uid !== expectedUid) return;
        receivedFirstSnapshot = true;
        window.clearTimeout(loadTimeout);

        const data = docSnap.exists() ? docSnap.data() : {};
        const cloudDecks = normalizeDecks(data.decks);
        const firstDeckId = Object.keys(cloudDecks)[0] || null;
        const safeCurrentDeckId = data.currentDeckId && cloudDecks[data.currentDeckId]
          ? data.currentDeckId
          : firstDeckId;

        if (pendingSaveCountRef.current > 0 || failedSaveRef.current) {
          deferredSnapshotRef.current = {
            uid: expectedUid,
            decks: cloudDecks,
            currentDeckId: safeCurrentDeckId
          };
          setCloudLoaded(true);
          setLoading(false);
          return;
        }

        deferredSnapshotRef.current = null;
        decksRef.current = cloudDecks;
        setDecks(cloudDecks);
        setCurrentDeckId(safeCurrentDeckId);
        setCloudLoaded(true);
        setLoading(false);
      },
      (error) => {
        if (auth.currentUser?.uid !== expectedUid) return;
        receivedFirstSnapshot = true;
        window.clearTimeout(loadTimeout);
        setSyncError(`Unable to load your vocabulary: ${error.message}`);
        setCloudLoaded(false);
        setLoading(false);
      }
    );

    return () => {
      window.clearTimeout(loadTimeout);
      unsubscribe();
    };
  }, [authReady, syncEpoch, user]);

  // --- 新增：遺忘曲線檢查 (Strict Time Decay) ---

  const saveToCloud = useCallback(async (newDecks, activeId, options = {}) => {
    if (!user || !cloudLoaded || authMergeRef.current || auth.currentUser?.uid !== user.uid) {
      setSaveError('Saving is temporarily paused while the account is changing.');
      return false;
    }

    const safeDecks = normalizeDecks(newDecks);
    if (Object.keys(safeDecks).length === 0 && !options.allowEmpty) {
      setSaveError('An empty save was blocked to protect your cloud data.');
      return false;
    }

    const resolvedActiveId = activeId === undefined ? (currentDeckId ?? null) : activeId;
    const userId = user.uid;
    const revision = saveRevisionRef.current + 1;
    saveRevisionRef.current = revision;
    const pendingSave = {
      userId,
      revision,
      decks: safeDecks,
      activeId: resolvedActiveId,
      options
    };

    pendingSaveCountRef.current += 1;
    setIsSaving(true);
    setSaveError('');

    const payload = {
      currentDeckId: resolvedActiveId,
      lastUpdated: serverTimestamp(),
      schemaVersion: 2
    };
    const mergeFields = ['currentDeckId', 'lastUpdated', 'schemaVersion'];

    if (options.replaceAll) {
      payload.decks = safeDecks;
      mergeFields.unshift('decks');
    } else {
      const changedDeckIds = [...new Set(options.changedDeckIds || [])]
        .filter(deckId => Object.hasOwn(safeDecks, deckId));
      const deletedDeckIds = [...new Set(options.deletedDeckIds || [])];
      const deckPatch = {};

      for (const deckId of changedDeckIds) {
        deckPatch[deckId] = safeDecks[deckId];
        mergeFields.push(new FieldPath('decks', deckId));
      }
      for (const deckId of deletedDeckIds) {
        deckPatch[deckId] = deleteField();
        mergeFields.push(new FieldPath('decks', deckId));
      }
      if (changedDeckIds.length > 0 || deletedDeckIds.length > 0) payload.decks = deckPatch;
    }

    const operation = saveQueueRef.current
      .catch(() => undefined)
      .then(() => {
        if (auth.currentUser?.uid !== userId) {
          throw new Error('The signed-in account changed before this save could finish.');
        }
        return setDoc(getUserDataRef(userId), payload, { mergeFields });
      });
    saveQueueRef.current = operation;

    try {
      await operation;
      if (!failedSaveRef.current || failedSaveRef.current.revision <= revision) {
        failedSaveRef.current = null;
        setSaveError('');
      }
      return true;
    } catch (error) {
      if (!failedSaveRef.current || failedSaveRef.current.revision <= revision) {
        failedSaveRef.current = pendingSave;
      }
      setSaveError(`Save failed: ${error.message}`);
      return false;
    } finally {
      pendingSaveCountRef.current -= 1;
      if (pendingSaveCountRef.current === 0) {
        setIsSaving(false);
        const deferredSnapshot = deferredSnapshotRef.current;
        if (!failedSaveRef.current && deferredSnapshot?.uid === auth.currentUser?.uid) {
          deferredSnapshotRef.current = null;
          decksRef.current = deferredSnapshot.decks;
          setDecks(deferredSnapshot.decks);
          setCurrentDeckId(deferredSnapshot.currentDeckId);
          setCloudLoaded(true);
          setLoading(false);
        }
      }
    }
  }, [cloudLoaded, currentDeckId, user]);

  const applyDecks = useCallback((nextDecks) => {
    const normalizedDecks = normalizeDecks(nextDecks);
    decksRef.current = normalizedDecks;
    setDecks(normalizedDecks);
    return normalizedDecks;
  }, []);

  const applyDecksAndSave = useCallback((nextDecks, activeId, options) => {
    const normalizedDecks = applyDecks(nextDecks);
    void saveToCloud(normalizedDecks, activeId, options);
    return normalizedDecks;
  }, [applyDecks, saveToCloud]);

  const retryFailedSave = () => {
    const failedSave = failedSaveRef.current;
    if (!failedSave) return;
    if (auth.currentUser?.uid !== failedSave.userId) {
      setSaveError('This unsaved change belongs to a different account and cannot be replayed here.');
      return;
    }
    void saveToCloud(failedSave.decks, failedSave.activeId, failedSave.options);
  };

  const discardFailedSave = () => {
    if (!failedSaveRef.current) return;
    if (!window.confirm('Discard the unsaved local changes and reload the last cloud version?')) return;
    failedSaveRef.current = null;
    saveQueueRef.current = Promise.resolve();
    pendingSaveCountRef.current = 0;
    deferredSnapshotRef.current = null;
    setIsSaving(false);
    setSaveError('');
    setSyncEpoch(epoch => epoch + 1);
  };
  // --- Time decay: move REVIEW / MASTERED words into DRIFTING after enough time ---
  useEffect(() => {
  if (!cloudLoaded || authMergeRef.current || failedSaveRef.current || !currentDeckId || !currentDeck?.words?.length) return;

  // For testing, keep this at 10 seconds. Change back to 24 * 60 * 60 * 1000 for production.
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  let hasChanges = false;

  const updatedWords = currentDeck.words.map(item => {
    if (item.isDeleted || item.isNigate) return item;

    let newItem = { ...item };
    const lastTouch = newItem.lastReviewed || newItem.lastInteraction || 0;
    const timeDiff = now - lastTouch;

    if (newItem.status === STATUS.REVIEW && timeDiff > ONE_DAY) {
      newItem = {
        ...newItem,
        status: STATUS.DRIFTING,
        reviewProgress: { spelling: 0, select: 0, reverseSelect: 0, sentence: 0 }
      };
      hasChanges = true;
    }

    if (newItem.status === STATUS.MASTERED && timeDiff > ONE_DAY * 5) {
      newItem = {
        ...newItem,
        status: STATUS.DRIFTING,
        successStreak: 0,
        reviewProgress: { spelling: 0, select: 0, reverseSelect: 0, sentence: 0 }
      };
      hasChanges = true;
    }

    if (newItem.status === STATUS.DRIFTING) {
      const hasProgress =
        (newItem.reviewProgress?.select || 0) > 0 ||
        (newItem.reviewProgress?.spelling || 0) > 0 ||
        (newItem.reviewProgress?.reverseSelect || 0) > 0 ||
        (newItem.reviewProgress?.sentence || 0) > 0;

      const lastInteraction = newItem.lastInteraction || now;

      if (hasProgress && now - lastInteraction > ONE_DAY) {
        newItem = {
          ...newItem,
          reviewProgress: { spelling: 0, select: 0, reverseSelect: 0, sentence: 0 }
        };
        hasChanges = true;
      }
    }

    return newItem;
  });

  if (!hasChanges) return;

  const newDecks = {
    ...decks,
    [currentDeckId]: {
      ...currentDeck,
      words: updatedWords
    }
  };

  applyDecksAndSave(newDecks, currentDeckId, { changedDeckIds: [currentDeckId] });
  }, [applyDecksAndSave, cloudLoaded, currentDeckId, currentDeck, decks]);

  const mergePendingIntoUser = useCallback(async (pending, targetUser) => {
    if (!pending || !targetUser || targetUser.isAnonymous) {
      throw new Error('A signed-in Google account is required to finish the merge.');
    }
    if (pending.targetUid && pending.targetUid !== targetUser.uid) {
      throw new Error('Please sign in with the Google account selected during the original merge.');
    }
    if (auth.currentUser?.uid !== targetUser.uid) {
      throw new Error('The signed-in account changed before the merge started.');
    }

    const result = await runTransaction(db, async transaction => {
      const targetRef = getUserDataRef(targetUser.uid);
      const snapshot = await transaction.get(targetRef);
      const cloudData = snapshot.exists() ? snapshot.data() : {};
      const { merged, idMap } = mergeDecksPreservingBoth(
        cloudData.decks,
        pending.decks,
        pending.sourceUid
      );
      const mappedGuestCurrent = idMap[pending.currentDeckId];
      const nextCurrentDeckId =
        (cloudData.currentDeckId && merged[cloudData.currentDeckId] && cloudData.currentDeckId) ||
        (mappedGuestCurrent && merged[mappedGuestCurrent] && mappedGuestCurrent) ||
        Object.keys(merged)[0] ||
        null;

      transaction.set(targetRef, {
        decks: merged,
        currentDeckId: nextCurrentDeckId,
        lastUpdated: serverTimestamp(),
        schemaVersion: 2
      }, {
        mergeFields: ['decks', 'currentDeckId', 'lastUpdated', 'schemaVersion']
      });
      return { decks: merged, currentDeckId: nextCurrentDeckId };
    });

    if (auth.currentUser?.uid !== targetUser.uid) {
      throw new Error('The signed-in account changed before the merge finished.');
    }

    clearPendingAuthMerge();
    setPendingAuthMerge(null);
    setMergeError('');
    failedSaveRef.current = null;
    setSaveError('');
    saveQueueRef.current = Promise.resolve();
    pendingSaveCountRef.current = 0;
    deferredSnapshotRef.current = null;
    setIsSaving(false);
    applyDecks(result.decks);
    setCurrentDeckId(result.currentDeckId);
    setCloudLoaded(true);
    setLoading(false);
    return result;
  }, [applyDecks]);

  const retryPendingAuthMerge = async () => {
    const targetUser = auth.currentUser;
    if (authActionRef.current || authBusy || !pendingAuthMerge || !targetUser || targetUser.isAnonymous) return;
    if (pendingAuthMerge.targetUid && pendingAuthMerge.targetUid !== targetUser.uid) {
      setMergeError('Sign out and choose the Google account used when this import started.');
      return;
    }
    authActionRef.current = true;
    setAuthBusy(true);
    setMergeError('');
    authMergeRef.current = true;
    try {
      const pendingForTarget = pendingAuthMerge.targetUid
        ? pendingAuthMerge
        : { ...pendingAuthMerge, targetUid: targetUser.uid };
      if (!pendingAuthMerge.targetUid) {
        setPendingAuthMerge(pendingForTarget);
        writePendingAuthMerge(pendingForTarget);
      }
      await mergePendingIntoUser(pendingForTarget, targetUser);
      authMergeRef.current = false;
      setSyncEpoch(epoch => epoch + 1);
    } catch (error) {
      setMergeError(error.message);
    } finally {
      authActionRef.current = false;
      setAuthBusy(false);
    }
  };

  const resumePendingMergeSignIn = async () => {
    if (authActionRef.current || authBusy || !pendingAuthMerge) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    authActionRef.current = true;
    setAuthBusy(true);
    setMergeError('');
    authMergeRef.current = true;

    try {
      const result = await signInWithPopup(auth, provider);
      if (pendingAuthMerge.targetUid && pendingAuthMerge.targetUid !== result.user.uid) {
        setMergeError('That is a different Google account. Sign out and choose the account used when the import started.');
        return;
      }

      const pendingForTarget = {
        ...pendingAuthMerge,
        targetUid: result.user.uid
      };
      setPendingAuthMerge(pendingForTarget);
      writePendingAuthMerge(pendingForTarget);
      await mergePendingIntoUser(pendingForTarget, result.user);
      authMergeRef.current = false;
      setSyncEpoch(epoch => epoch + 1);
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        setMergeError(`Could not resume the import: ${error.message}`);
      }
    } finally {
      authActionRef.current = false;
      setAuthBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (authActionRef.current || authBusy || authMergeRef.current) return;
    if (failedSaveRef.current) {
      setSaveError('Retry or discard the unsaved changes before switching accounts.');
      return;
    }
    const previousUser = auth.currentUser;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    let keepSyncPaused = false;
    authActionRef.current = true;
    setAuthBusy(true);
    setAuthError('');
    authMergeRef.current = true;

    try {
        if (!previousUser?.isAnonymous) return;

        try {
          const linkedResult = await linkWithPopup(previousUser, provider);
          setUser(linkedResult.user);
          return;
        } catch (linkError) {
          if (linkError.code === 'auth/popup-closed-by-user' || linkError.code === 'auth/cancelled-popup-request') return;
          if (linkError.code !== 'auth/credential-already-in-use') throw linkError;

          const credential = GoogleAuthProvider.credentialFromError(linkError);
          if (!credential) throw new Error('Google did not return a reusable sign-in credential.');

          await saveQueueRef.current;
          await withTimeout(
            waitForPendingWrites(db),
            12000,
            'Timed out while backing up guest changes. Check your connection and try again.'
          );
          const pending = {
            version: 1,
            sourceUid: previousUser.uid,
            decks: cloneDecks(decksRef.current),
            currentDeckId,
            createdAt: Date.now()
          };
          writePendingAuthMerge(pending);
          setPendingAuthMerge(pending);

          const googleResult = await signInWithCredential(auth, credential);
          keepSyncPaused = true;
          const pendingWithTarget = { ...pending, targetUid: googleResult.user.uid };
          setPendingAuthMerge(pendingWithTarget);
          writePendingAuthMerge(pendingWithTarget);

          await mergePendingIntoUser(pendingWithTarget, googleResult.user);
          keepSyncPaused = false;
        }
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          return;
        }
        const accountChanged = previousUser && auth.currentUser?.uid !== previousUser.uid;
        if (keepSyncPaused || accountChanged) {
          keepSyncPaused = true;
          setMergeError(`Guest import is paused: ${error.message}`);
        } else {
          setAuthError(`Login failed: ${error.message}`);
        }
    } finally {
      if (!keepSyncPaused) {
        authMergeRef.current = false;
        setSyncEpoch(epoch => epoch + 1);
      }
      authActionRef.current = false;
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (authActionRef.current || authBusy) return;
    authActionRef.current = true;
    setAuthBusy(true);
    authMergeRef.current = true;
    try {
      if (!pendingAuthMerge) {
        await saveQueueRef.current;
        if (failedSaveRef.current) {
          throw new Error('Unsaved changes must be retried or discarded before logout.');
        }
      }
      await signOut(auth);
      failedSaveRef.current = null;
      saveQueueRef.current = Promise.resolve();
      pendingSaveCountRef.current = 0;
      deferredSnapshotRef.current = null;
      setIsSaving(false);
      setSaveError('');
      applyDecks({});
      setCurrentDeckId(null);
      setCloudLoaded(false);
      setLoading(!pendingAuthMerge);
      setView('decks');
    } catch (error) {
      setAuthError(`Logout paused: ${error.message}`);
    } finally {
      if (!pendingAuthMerge) authMergeRef.current = false;
      authActionRef.current = false;
      setAuthBusy(false);
    }
  };

  // 4. CRUD Handlers 
  const canMutateCloudData = () => {
    if (authMergeRef.current || authActionRef.current || authBusy) {
      return false;
    }
    if (failedSaveRef.current) {
      setSaveError('Retry or discard the unsaved changes before making another change.');
      return false;
    }
    if (!user || !cloudLoaded || auth.currentUser?.uid !== user.uid) {
      return false;
    }
    return true;
  };

  const handleUpdateItem = (updatedItem) => {
      if (!canMutateCloudData()) return;
      const previousDecks = decksRef.current;
      const targetDeck = previousDecks[currentDeckId];
      if (!targetDeck) return;
      const normalizedItem = normalizeVocabItem(updatedItem);
      const newWords = targetDeck.words.map(item => item.id === normalizedItem.id ? normalizedItem : item);
      applyDecksAndSave({
        ...previousDecks,
        [currentDeckId]: { ...targetDeck, words: newWords }
      }, currentDeckId, { changedDeckIds: [currentDeckId] });
  };

  const handleDeleteItem = (id) => {
      if (!canMutateCloudData()) return;
      const previousDecks = decksRef.current;
      const targetDeck = previousDecks[currentDeckId];
      if (!targetDeck) return;
      const newWords = targetDeck.words.map(item => item.id === id ? { ...item, isDeleted: true } : item);
      applyDecksAndSave({
        ...previousDecks,
        [currentDeckId]: { ...targetDeck, words: newWords }
      }, currentDeckId, { changedDeckIds: [currentDeckId] });
  };

  const handleAddItem = (newItem) => {
      if (!canMutateCloudData()) return;
      const previousDecks = decksRef.current;
      const targetDeck = previousDecks[currentDeckId];
      if (!targetDeck) return;
      const maxId = targetDeck.words.reduce((maximum, current) => {
        const numericId = Number(current.id);
        return Number.isFinite(numericId) ? Math.max(maximum, numericId) : maximum;
      }, 1000);
      const item = normalizeVocabItem({ ...newItem, id: maxId + 1, isCustomized: true });
      applyDecksAndSave({
        ...previousDecks,
        [currentDeckId]: { ...targetDeck, words: [item, ...targetDeck.words] }
      }, currentDeckId, { changedDeckIds: [currentDeckId] });
  };

  // 修改 App 元件內的 handleAddDeck，接收 loadDefaults 參數
  const handleAddDeck = (title, language, loadDefaults) => {
    if (!canMutateCloudData()) return;
    const uniqueId = window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newId = `deck_${uniqueId}`;
    
    // 決定要不要載入預設字
    let starterWords = [];
    if (loadDefaults && DEFAULT_VOCAB_SETS[language]) {
        // 正規化單字結構
        starterWords = DEFAULT_VOCAB_SETS[language].map((w, i) => normalizeVocabItem({
            ...w, 
            id: i + 1, // 重新編號
            isCustomized: false // 標記為系統預設
        }));
    }

    const newDeck = {
        id: newId,
        title: title,
        language: language,
        words: starterWords // 放入單字
    };
    
    applyDecksAndSave(
      { ...decksRef.current, [newId]: newDeck },
      newId,
      { changedDeckIds: [newId] }
    );
    setCurrentDeckId(newId);
    
    // 如果有預設單字，直接回 Dashboard，不然去 Vocab 頁面加字
    setView('home');
  };

  // --- 在 App 元件內 (handleAddDeck 下方) ---

  // --- 修改後的 handleDeleteDeck (允許刪光光) ---
  const handleDeleteDeck = (deckId) => {
    if (!canMutateCloudData()) return;
    if (!window.confirm("Are you sure you want to delete this deck? This cannot be undone.")) {
        return;
    }

    const previousDecks = decksRef.current;
    const deckKeys = Object.keys(previousDecks);
    const remainingKeys = deckKeys.filter(k => k !== deckId);
    let nextActiveId = currentDeckId;

    if (deckId === currentDeckId) {
        nextActiveId = remainingKeys.length > 0 ? remainingKeys[0] : null;
        setCurrentDeckId(nextActiveId);
    }

    const newDecks = { ...previousDecks };
    delete newDecks[deckId];
    applyDecksAndSave(newDecks, nextActiveId, { allowEmpty: true, deletedDeckIds: [deckId] });

    if (!nextActiveId || deckId === currentDeckId) {
        setView('decks');
    }
  };

  const handleSelectDeck = async (deckId) => {
    if (!canMutateCloudData()) return;
    setCurrentDeckId(deckId);
    setView('home');
  
    if (!user || !cloudLoaded) return;
    await saveToCloud(decksRef.current, deckId, { changedDeckIds: [] });
  };

  const handleOpenVocab = (filter) => { setVocabFilter(filter); setView('vocab'); };

  const retryGuestSession = () => {
    setAuthError('');
    setLoading(true);
    void signInAnonymously(auth).catch(error => {
      setAuthError(`Unable to start a guest session: ${error.message}`);
      setLoading(false);
    });
  };

  const retryCloudLoad = () => {
    setSyncError('');
    setLoading(true);
    setSyncEpoch(epoch => epoch + 1);
  };

  if (pendingAuthMerge) {
    const hasGoogleUser = Boolean(user && !user.isAnonymous);
    const isWrongGoogleUser = Boolean(
      hasGoogleUser && pendingAuthMerge.targetUid && pendingAuthMerge.targetUid !== user.uid
    );
    const canFinishMerge = hasGoogleUser && !isWrongGoogleUser;

    return (
      <div className="min-h-dvh bg-slate-100 p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">
            {isWrongGoogleUser ? 'Choose the original Google account' : 'Finish importing guest decks'}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {isWrongGoogleUser
              ? 'This is not the account selected when the import started. Your guest vocabulary remains safely backed up on this device.'
              : 'Your guest vocabulary is safely backed up. Finish the secure merge before continuing.'}
          </p>
          {mergeError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{mergeError}</p>}
          {!authReady ? (
            <div role="status" className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-600"><Loader2 className="h-5 w-5 animate-spin"/> Checking account…</div>
          ) : isWrongGoogleUser ? (
            <button type="button" disabled={authBusy} onClick={handleLogout} className="mt-6 min-h-11 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-50">
              {authBusy ? 'Signing out…' : 'Sign out and choose again'}
            </button>
          ) : canFinishMerge ? (
            <button type="button" disabled={authBusy} onClick={retryPendingAuthMerge} className="mt-6 min-h-11 w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">
              {authBusy ? 'Merging…' : pendingAuthMerge.targetUid ? 'Retry secure merge' : 'Import into this account'}
            </button>
          ) : (
            <button type="button" disabled={authBusy} onClick={resumePendingMergeSignIn} className="mt-6 min-h-11 w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">
              {authBusy ? 'Opening Google…' : 'Sign in to resume import'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="min-h-dvh bg-slate-100 p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Unable to start DuanLingo</h1>
          <p role="alert" className="mt-3 text-sm text-red-700">{authError}</p>
          <button type="button" onClick={retryGuestSession} className="mt-6 min-h-11 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white">Retry</button>
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="min-h-dvh bg-slate-100 p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Cloud data could not be loaded</h1>
          <p role="alert" className="mt-3 text-sm text-red-700">{syncError}</p>
          <button type="button" onClick={retryCloudLoad} className="mt-6 min-h-11 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white">Retry</button>
        </div>
      </div>
    );
  }

  if (loading || !isVideoDone) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        {!isVideoDone && (
          <video
            autoPlay muted playsInline aria-hidden="true"
            onEnded={() => setIsVideoDone(true)}
            onError={() => setIsVideoDone(true)}
            className="absolute inset-0 w-full h-full object-contain"
          >
            <source src="/loading.mp4" type="video/mp4" />
          </video>
        )}
        {loading && isVideoDone && <div role="status" className="text-center text-white"><Loader2 className="mx-auto h-8 w-8 animate-spin"/><p className="mt-3 text-sm font-bold">Loading your vocabulary…</p></div>}
        {!isVideoDone && <button type="button" onClick={() => setIsVideoDone(true)} className="absolute bottom-8 right-8 min-h-11 rounded-full bg-white/90 px-5 py-2 text-sm font-bold text-slate-900">Skip intro</button>}
      </div>
    );
  }

  return (
  <div className="h-dvh min-h-dvh w-full bg-slate-200 flex items-center justify-center font-sans">
    <div className="w-full max-w-md h-full md:h-[90dvh] bg-white md:rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col">
        
        {isSaving && (
            <div role="status" className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur text-indigo-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-2 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </div>
        )}
        {authBusy && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm" role="status" aria-live="polite">
            <div className="rounded-2xl bg-white px-6 py-5 text-center font-bold text-slate-800 shadow-xl">
              <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-indigo-600" />
              Securing your account and vocabulary…
            </div>
          </div>
        )}
        {saveError && failedSaveRef.current && (
          <div className="absolute inset-0 z-[65] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
            <div role="alertdialog" aria-modal="true" aria-labelledby="save-failed-title" className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-red-800 shadow-xl">
              <h2 id="save-failed-title" className="text-lg font-bold">Your latest changes are not saved</h2>
              <p className="mt-2 text-sm">{saveError}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={authBusy || isSaving} onClick={discardFailedSave} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-700 disabled:opacity-50">Reload cloud</button>
                <button type="button" disabled={authBusy || isSaving} onClick={retryFailedSave} className="min-h-11 rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">Retry save</button>
              </div>
            </div>
          </div>
        )}
        {saveError && !failedSaveRef.current && (
          <div role="alert" className="absolute bottom-4 left-4 right-4 z-50 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800 shadow-lg">{saveError}</div>
        )}
        {authError && user && (
          <div role="alert" className="absolute top-16 left-4 right-4 z-50 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{authError}</div>
        )}

        <div className="flex-1 overflow-hidden relative flex flex-col">
          
          {view === 'decks' && (
             <DeckLibrary 
                decks={decks} 
                user={user} // 傳入使用者資訊
                onLogin={handleGoogleLogin} // 傳入登入函式
                onLogout={handleLogout} // 傳入登出函式
                onSelectDeck={handleSelectDeck}
                onAddDeck={handleAddDeck}
                onDeleteDeck={handleDeleteDeck}
             />
          )}

          {view === 'home' && (
              <Dashboard 
                  vocabList={vocabList} 
                  onStartMode={setView} 
                  onOpenVocab={handleOpenVocab}
                  user={user} 
                  currentLanguage={currentDeck.language}
                  onSwitchDeck={() => setView('decks')} 

                  onLogin={handleGoogleLogin}
                  onLogout={handleLogout}
              />
          )}

          {(view === 'learning' || view === 'review' || view === 'hell') && (
              <SessionController 
                  mode={view} 
                  vocabList={vocabList} 
                  langCode={currentSpeechCode}
                  targetLanguage={currentDeck.language}
                  onComplete={() => setView('home')}
                  onUpdateItem={handleUpdateItem}
              />
          )}

          {view.startsWith('arcade-') && (
              <ArcadeContainer 
                  vocabList={vocabList} 
                  gameType={view.replace('arcade-', '')}
                  langCode={currentSpeechCode}
                  targetLanguage={currentDeck.language}
                  onBack={() => setView('home')} 
                  onUpdateItem={handleUpdateItem}
              />
          )}

          {view === 'vocab' && (
              <VocabBrowser 
                  vocabList={vocabList} 
                  langCode={currentSpeechCode}
                  onBack={() => setView('home')} 
                  onUpdateItem={handleUpdateItem}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                  initialFilter={vocabFilter}
                  currentLanguage={currentDeck.language}
              />
          )}
        </div>
    </div>
  </div>
  );
};

export default App;
