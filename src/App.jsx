import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
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
  Timer, 
  Star, 
  TrendingDown, 
  Trash2, 
  Volume2, 
  ListChecks, 
  Cloud, 
  Loader2, 
  Pencil, 
  Save, 
  Plus, 
  Headphones, 
  Eye, 
  Keyboard, 
  Flame, 
  Skull, 
  GraduationCap, 
  Play, 
  CircleDashed, 
  Filter, 
  Mic, 
  Search, 
  Sparkles,
  Move,
  Shuffle
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFgk2ucxJ3KU7uRQHvsGxykm8ctcttCQE",
  authDomain: "duanlingo.firebaseapp.com",
  projectId: "duanlingo",
  storageBucket: "duanlingo.firebasestorage.app",
  messagingSenderId: "523701499406",
  appId: "1:523701499406:web:a1916c58dc99e4978fae5f",
  measurementId: "G-3RH20XBNZ8"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const STORAGE_KEY = 'vocab_multilingua_v1';
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
    { german: "Wasser", english: "Water", gender: "n", example: "Ein Glas Wasser, bitte." },
    { german: "Brot", english: "Bread", gender: "n", example: "Das Brot ist frisch." },
    { german: "Mann", english: "Man", gender: "n", example: "Der Mann ist groß." },
    { german: "Frau", english: "Woman", gender: "n", example: "Die Frau liest." },
    { german: "Liebe", english: "Love", gender: "n", example: "Liebe ist wichtig." },
    { german: "Haus", english: "House", gender: "n", example: "Das Haus ist alt." },
    { german: "Katze", english: "Cat", gender: "n", example: "Die Katze schläft." },
    { german: "Hund", english: "Dog", gender: "n", example: "Der Hund bellt." },
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
  ]
};

const INITIAL_VOCAB_DATA = [
  // Nouns (Abstract & Society)
  { id: 1, german: "die Herausforderung", english: "the challenge", example: "Das ist eine große Herausforderung für uns.", gender: "f" },
  { id: 2, german: "die Erfahrung", english: "the experience", example: "Ich habe viel Erfahrung in diesem Bereich.", gender: "f" },
  { id: 3, german: "die Verantwortung", english: "the responsibility", example: "Er trägt die volle Verantwortung.", gender: "f" },
  { id: 4, german: "der Fortschritt", english: "the progress", example: "Wir machen jeden Tag Fortschritte.", gender: "m" },
  { id: 5, german: "die Gelegenheit", english: "the opportunity", example: "Nutze die Gelegenheit, Deutsch zu sprechen.", gender: "f" },
  { id: 6, german: "die Umwelt", english: "the environment", example: "Wir müssen die Umwelt schützen.", gender: "f" },
  { id: 7, german: "die Beziehung", english: "the relationship", example: "Ihre Beziehung ist sehr stark.", gender: "f" },
  { id: 8, german: "die Gesellschaft", english: "society", example: "Die Probleme der modernen Gesellschaft.", gender: "f" },
  { id: 9, german: "die Bedingung", english: "the condition", example: "Unter diesen Bedingungen kann ich nicht arbeiten.", gender: "f" },
  { id: 10, german: "das Ziel", english: "the goal", example: "Mein Ziel ist es, B2 zu erreichen.", gender: "n" },
  { id: 11, german: "der Eindruck", english: "the impression", example: "Ich habe den Eindruck, dass er lügt.", gender: "m" },
  { id: 12, german: "die Tatsache", english: "the fact", example: "Es ist eine bekannte Tatsache.", gender: "f" },
  { id: 13, german: "die Ausnahme", english: "the exception", example: "Das ist die Ausnahme von der Regel.", gender: "f" },
  { id: 14, german: "die Ursache", english: "the cause", example: "Die Ursache des Problems ist unklar.", gender: "f" },
  { id: 15, german: "das Bewusstsein", english: "consciousness/awareness", example: "Das Umweltbewusstsein steigt.", gender: "n" },
  { id: 16, german: "die Maßnahme", english: "the measure", example: "Wir müssen sofort Maßnahmen ergreifen.", gender: "f" },
  { id: 17, german: "der Zusammenhang", english: "the context/connection", example: "In diesem Zusammenhang ist das wichtig.", gender: "m" },
  { id: 18, german: "der Einfluss", english: "the influence", example: "Er hat einen schlechten Einfluss auf dich.", gender: "m" },
  { id: 19, german: "die Entwicklung", english: "the development", example: "Die wirtschaftliche Entwicklung ist positiv.", gender: "f" },
  { id: 20, german: "die Leistung", english: "the performance", example: "Seine Leistung in der Schule ist gut.", gender: "f" },
  { id: 21, german: "die Voraussetzung", english: "the prerequisite", example: "Gesundheit ist die Voraussetzung für Glück.", gender: "f" },
  { id: 22, german: "die Vielfalt", english: "the variety/diversity", example: "Die Vielfalt der Angebote ist groß.", gender: "f" },
  { id: 23, german: "die Forschung", english: "the research", example: "Die Forschung hat neue Ergebnisse geliefert.", gender: "f" },
  { id: 24, german: "die Stellungnahme", english: "the statement", example: "Bitte geben Sie eine Stellungnahme ab.", gender: "f" },
  { id: 25, german: "die Auffassung", english: "the view/opinion", example: "Ich bin der Auffassung, dass das falsch ist.", gender: "f" },
  { id: 26, german: "die Belastung", english: "the burden/strain", example: "Die Lärmbelastung ist hier sehr hoch.", gender: "f" },
  { id: 27, german: "die Quelle", english: "the source", example: "Nennen Sie bitte Ihre Quelle.", gender: "f" },
  { id: 28, german: "die Wirkung", english: "the effect", example: "Die Tabletten haben eine schnelle Wirkung.", gender: "f" },
  { id: 29, german: "die Fähigkeit", english: "the ability", example: "Sie hat die Fähigkeit, Menschen zu motivieren.", gender: "f" },
  { id: 30, german: "die Vermutung", english: "the assumption/guess", example: "Das ist nur eine Vermutung.", gender: "f" },
  { id: 31, german: "der Bereich", english: "the area/field", example: "In welchem Bereich arbeiten Sie?", gender: "m" },
  { id: 32, german: "die Gestaltung", english: "the design", example: "Die Gestaltung des Raumes gefällt mir.", gender: "f" },
  { id: 33, german: "der Anspruch", english: "the claim/demand", example: "Sie haben keinen Anspruch auf Ersatz.", gender: "m" },
  { id: 34, german: "die Grundlage", english: "the basis", example: "Vertrauen ist die Grundlage einer Beziehung.", gender: "f" },
  { id: 35, german: "die Haltung", english: "the attitude/posture", example: "Seine Haltung zu diesem Thema ist klar.", gender: "f" },
  { id: 36, german: "die Ebene", english: "the level/plane", example: "Wir müssen auf sachlicher Ebene diskutieren.", gender: "f" },
  { id: 37, german: "die Auseinandersetzung", english: "the dispute", example: "Er geht jeder Auseinandersetzung aus dem Weg.", gender: "f" },
  { id: 38, german: "die Bedeutung", english: "the meaning", example: "Dieses Wort hat mehrere Bedeutungen.", gender: "f" },
  { id: 39, german: "die Folge", english: "the consequence", example: "Das hat schlimme Folgen.", gender: "f" },
  { id: 40, german: "die Vorstellung", english: "the idea/imagination", example: "Ich habe eine genaue Vorstellung davon.", gender: "f" },
  { id: 41, german: "die Möglichkeit", english: "the possibility", example: "Es gibt keine andere Möglichkeit.", gender: "f" },
  { id: 42, german: "der Anteil", english: "the share/proportion", example: "Der Anteil der Kosten ist hoch.", gender: "m" },
  { id: 43, german: "die Berechtigung", english: "the justification", example: "Das hat seine Berechtigung.", gender: "f" },
  { id: 44, german: "der Prozess", english: "the process", example: "Der Prozess dauert sehr lange.", gender: "m" },
  { id: 45, german: "die Annahme", english: "the assumption", example: "Ich gehe von der Annahme aus, dass es stimmt.", gender: "f" },
  { id: 46, german: "der Verlust", english: "the loss", example: "Der Verlust des Schlüssels ist ärgerlich.", gender: "m" },
  { id: 47, german: "die Erwartung", english: "the expectation", example: "Er hat meine Erwartungen übertroffen.", gender: "f" },
  { id: 48, german: "der Wert", english: "the value", example: "Der Wert des Autos ist gesunken.", gender: "m" },
  { id: 49, german: "die Einstellung", english: "the attitude", example: "Ich muss meine Einstellung ändern.", gender: "f" },
  { id: 50, german: "die Auswirkung", english: "the impact", example: "Der Klimawandel hat negative Auswirkungen.", gender: "f" },
  
  // Verbs (Action & Thinking)
  { id: 51, german: "abhängen von", english: "to depend on", example: "Es hängt vom Wetter ab.", gender: "v" },
  { id: 52, german: "sich entscheiden", english: "to decide", example: "Er hat sich für das Studium entschieden.", gender: "v" },
  { id: 53, german: "überzeugt sein", english: "to be convinced", example: "Ich bin davon überzeugt, dass es klappt.", gender: "v" },
  { id: 54, german: "teilnehmen an", english: "to participate in", example: "Ich möchte an dem Kurs teilnehmen.", gender: "v" },
  { id: 55, german: "verursachen", english: "to cause", example: "Der Sturm verursachte große Schäden.", gender: "v" },
  { id: 56, german: "erwähnen", english: "to mention", example: "Er hat vergessen, das zu erwähnen.", gender: "v" },
  { id: 57, german: "ausgeben", english: "to spend (money)", example: "Wir haben viel Geld im Urlaub ausgegeben.", gender: "v" },
  { id: 58, german: "sicherstellen", english: "to ensure", example: "Sie müssen sicherstellen, dass alles funktioniert.", gender: "v" },
  { id: 59, german: "gelten als", english: "to be considered as", example: "Er gilt als Experte auf seinem Gebiet.", gender: "v" },
  { id: 60, german: "überlegen", english: "to consider/think", example: "Ich werde es mir überlegen.", gender: "v" },
  { id: 61, german: "vermeiden", english: "to avoid", example: "Wir sollten Stress vermeiden.", gender: "v" },
  { id: 62, german: "behaupten", english: "to claim", example: "Er behauptet, er war nicht dort.", gender: "v" },
  { id: 63, german: "bewältigen", english: "to cope with/manage", example: "Wie bewältigst du den Stress?", gender: "v" },
  { id: 64, german: "bedeuten", english: "to mean", example: "Was bedeutet dieses Schild?", gender: "v" },
  { id: 65, german: "herstellen", english: "to produce", example: "Diese Firma stellt Möbel her.", gender: "v" },
  { id: 66, german: "verbinden", english: "to connect", example: "Können Sie mich mit Herrn Müller verbinden?", gender: "v" },
  { id: 67, german: "sich widmen", english: "to dedicate oneself", example: "Er widmet sich seiner Familie.", gender: "v" },
  { id: 68, german: "zurückführen auf", english: "to attribute to", example: "Der Fehler ist auf Stress zurückzuführen.", gender: "v" },
  { id: 69, german: "feststellen", english: "to determine", example: "Wir müssen den Schaden feststellen.", gender: "v" },
  { id: 70, german: "entstehen", english: "to arise/develop", example: "Hier soll ein neuer Park entstehen.", gender: "v" },
  { id: 71, german: "beitragen zu", english: "to contribute to", example: "Wir wollen zum Umweltschutz beitragen.", gender: "v" },
  { id: 72, german: "erhalten", english: "to receive/maintain", example: "Wir müssen die Natur erhalten.", gender: "v" },
  { id: 73, german: "verfügen über", english: "to possess/have", example: "Das Haus verfügt über einen großen Garten.", gender: "v" },
  { id: 74, german: "durchführen", english: "to conduct", example: "Wir führen ein Experiment durch.", gender: "v" },
  { id: 75, german: "entgegenwirken", english: "to counteract", example: "Wir müssen dem Klimawandel entgegenwirken.", gender: "v" },
  { id: 76, german: "erwerben", english: "to acquire", example: "Sie hat viele Kenntnisse erworben.", gender: "v" },
  { id: 77, german: "veröffentlichen", english: "to publish", example: "Der Artikel wurde gestern veröffentlicht.", gender: "v" },
  { id: 78, german: "enttäuschen", english: "to disappoint", example: "Ich möchte dich nicht enttäuschen.", gender: "v" },
  { id: 79, german: "verhindern", english: "to prevent", example: "Wir konnten den Unfall verhindern.", gender: "v" },
  { id: 80, german: "fördern", english: "to promote", example: "Wir müssen Talente frühzeitig fördern.", gender: "v" },
  { id: 81, german: "scheitern", english: "to fail", example: "Das Projekt ist am Geld gescheitert.", gender: "v" },
  { id: 82, german: "beeinflussen", english: "to influence", example: "Das Wetter beeinflusst meine Laune.", gender: "v" },
  { id: 83, german: "nachweisen", english: "to prove", example: "Sie konnte ihre Unschuld nachweisen.", gender: "v" },
  { id: 84, german: "überfordern", english: "to overwhelm", example: "Diese Aufgabe überfordert mich.", gender: "v" },
  { id: 85, german: "verhandeln", english: "to negotiate", example: "Wir müssen über den Preis verhandeln.", gender: "v" },
  { id: 86, german: "vermuten", english: "to suspect", example: "Ich vermute, dass er krank ist.", gender: "v" },
  { id: 87, german: "beseitigen", english: "to eliminate", example: "Wir müssen die Hindernisse beseitigen.", gender: "v" },
  { id: 88, german: "sich durchsetzen", english: "to prevail", example: "Die bessere Idee wird sich durchsetzen.", gender: "v" },
  { id: 89, german: "berücksichtigen", english: "to consider", example: "Man muss alle Faktoren berücksichtigen.", gender: "v" },
  { id: 90, german: "ermöglichen", english: "to enable", example: "Das Internet ermöglicht schnelle Kommunikation.", gender: "v" },
  { id: 91, german: "betonen", english: "to emphasize", example: "Er betonte die Wichtigkeit des Projekts.", gender: "v" },
  { id: 92, german: "genehmigen", english: "to approve", example: "Der Chef hat den Urlaub genehmigt.", gender: "v" },
  { id: 93, german: "leugnen", english: "to deny", example: "Er leugnete die Tat.", gender: "v" },
  { id: 94, german: "beurteilen", english: "to judge/assess", example: "Es ist schwer, die Lage zu beurteilen.", gender: "v" },
  { id: 95, german: "sich ereignen", english: "to occur/happen", example: "Der Unfall ereignete sich gestern.", gender: "v" },
  { id: 96, german: "verbergen", english: "to hide/conceal", example: "Sie verbarg ihr Gesicht hinter den Händen.", gender: "v" },
  { id: 97, german: "widersprechen", english: "to contradict", example: "Ich muss Ihnen leider widersprechen.", gender: "v" },
  { id: 98, german: "überwinden", english: "to overcome", example: "Wir müssen unsere Ängste überwinden.", gender: "v" },
  { id: 99, german: "pflegen", english: "to maintain/care for", example: "Sie pflegt ihre Kontakte.", gender: "v" },
  { id: 100, german: "beobachten", english: "to observe", example: "Wir beobachten die Situation genau.", gender: "v" },

  // Adjectives & Adverbs
  { id: 101, german: "begeistert", english: "enthusiastic", example: "Sie war von der Idee begeistert.", gender: "adj" },
  { id: 102, german: "nachhaltig", english: "sustainable", example: "Wir müssen nachhaltige Lösungen finden.", gender: "adj" },
  { id: 103, german: "notwendig", english: "necessary", example: "Es ist notwendig, pünktlich zu sein.", gender: "adj" },
  { id: 104, german: "ehrlich", english: "honest", example: "Um ehrlich zu sein, weiß ich es nicht.", gender: "adj" },
  { id: 105, german: "zufrieden", english: "satisfied", example: "Bist du mit dem Ergebnis zufrieden?", gender: "adj" },
  { id: 106, german: "allerdings", english: "however", example: "Der Film war gut, allerdings etwas zu lang.", gender: "adv" },
  { id: 107, german: "verfügbar", english: "available", example: "Die Tickets sind ab morgen verfügbar.", gender: "adj" },
  { id: 108, german: "erforderlich", english: "required", example: "Für diesen Job ist Erfahrung erforderlich.", gender: "adj" },
  { id: 109, german: "offensichtlich", english: "obvious", example: "Es ist offensichtlich, dass er recht hat.", gender: "adj" },
  { id: 110, german: "entsprechend", english: "appropriate", example: "Bitte kleiden Sie sich entsprechend.", gender: "adj" },
  { id: 111, german: "zugleich", english: "at the same time", example: "Das Buch ist spannend und lehrreich zugleich.", gender: "adv" },
  { id: 112, german: "vorhanden", english: "existing/available", example: "Ist noch Kaffee vorhanden?", gender: "adj" },
  { id: 113, german: "trotzdem", english: "nevertheless", example: "Es ist teuer, aber ich kaufe es trotzdem.", gender: "adv" },
  { id: 114, german: "erstaunlich", english: "amazing", example: "Das Ergebnis ist wirklich erstaunlich.", gender: "adj" },
  { id: 115, german: "einschließlich", english: "including", example: "Der Preis ist einschließlich Versand.", gender: "prep" },
  { id: 116, german: "vermutlich", english: "probably", example: "Er kommt vermutlich später.", gender: "adv" },
  { id: 117, german: "zunehmend", english: "increasingly", example: "Es wird zunehmend schwieriger.", gender: "adv" },
  { id: 118, german: "gleichzeitig", english: "simultaneously", example: "Sie lachte und weinte gleichzeitig.", gender: "adv" },
  { id: 119, german: "entscheidend", english: "decisive", example: "Der entscheidende Moment war gestern.", gender: "adj" },
  { id: 120, german: "unabhängig", english: "independent", example: "Sie ist finanziell unabhängig.", gender: "adj" },
  { id: 121, german: "ausreichend", english: "sufficient", example: "Wir haben ausreichend Essen.", gender: "adj" },
  { id: 122, german: "leistungsfähig", english: "powerful/efficient", example: "Wir brauchen einen leistungsfähigen Computer.", gender: "adj" },
  { id: 123, german: "vernünftig", english: "sensible", example: "Das war eine sehr vernünftige Entscheidung.", gender: "adj" },
  { id: 124, german: "umfassend", english: "comprehensive", example: "Sie hat umfassende Kenntnisse.", gender: "adj" },
  { id: 125, german: "verzichtbar", english: "dispensable", example: "Luxusgüter sind verzichtbar.", gender: "adj" },
  { id: 126, german: "effizient", english: "efficient", example: "Wir müssen effizienter arbeiten.", gender: "adj" },
  { id: 127, german: "zeitgemäß", english: "modern/contemporary", example: "Diese Methoden sind nicht mehr zeitgemäß.", gender: "adj" },
  { id: 128, german: "grundsätzlich", english: "fundamentally", example: "Ich bin grundsätzlich dafür.", gender: "adv" },
  { id: 129, german: "geeignet", english: "suitable", example: "Dieser Film ist nicht für Kinder geeignet.", gender: "adj" },
  { id: 130, german: "relevant", english: "relevant", example: "Diese Information ist sehr relevant.", gender: "adj" },
  { id: 131, german: "anspruchsvoll", english: "demanding", example: "Der Kunde ist sehr anspruchsvoll.", gender: "adj" },
  { id: 132, german: "langfristig", english: "long-term", example: "Wir brauchen eine langfristige Lösung.", gender: "adj" },
  { id: 133, german: "unverzichtbar", english: "indispensable", example: "Wasser ist unverzichtbar.", gender: "adj" },
  { id: 134, german: "gelegentlich", english: "occasionally", example: "Wir sehen uns gelegentlich.", gender: "adv" },
  { id: 135, german: "kaum", english: "hardly/barely", example: "Ich kann es kaum glauben.", gender: "adv" },
  { id: 136, german: "anscheinend", english: "apparently", example: "Anscheinend hat er es vergessen.", gender: "adv" },
  { id: 137, german: "teilweise", english: "partly", example: "Das stimmt teilweise.", gender: "adv" },
  { id: 138, german: "lediglich", english: "merely/only", example: "Es war lediglich ein Missverständnis.", gender: "adv" },
  { id: 139, german: "stets", english: "always/constantly", example: "Er ist stets pünktlich.", gender: "adv" },
  { id: 140, german: "bislang", english: "so far", example: "Bislang lief alles gut.", gender: "adv" },
  { id: 141, german: "äußerst", english: "extremely", example: "Das ist äußerst wichtig.", gender: "adv" },
  { id: 142, german: "ziemlich", english: "quite", example: "Es ist ziemlich kalt heute.", gender: "adv" },
  { id: 143, german: "durchaus", english: "absolutely/quite", example: "Das ist durchaus möglich.", gender: "adv" },
  { id: 144, german: "ebenfalls", english: "likewise/also", example: "Schönen Tag! - Danke, ebenfalls.", gender: "adv" },
  { id: 145, german: "dennoch", english: "nevertheless/yet", example: "Es regnete, dennoch gingen wir spazieren.", gender: "adv" },
  { id: 146, german: "keineswegs", english: "by no means", example: "Das ist keineswegs sicher.", gender: "adv" },
  { id: 147, german: "eher", english: "rather/sooner", example: "Ich würde eher Tee trinken.", gender: "adv" },
  { id: 148, german: "beinahe", english: "almost/nearly", example: "Ich hätte es beinahe vergessen.", gender: "adv" },
  { id: 149, german: "eventuell", english: "possibly/perhaps", example: "Eventuell komme ich später.", gender: "adv" },
  { id: 150, german: "übrigens", english: "by the way", example: "Übrigens, hast du schon gehört?", gender: "adv" },

  // More Nouns
  { id: 151, german: "der Wettbewerb", english: "the competition", example: "Der Wettbewerb ist hart.", gender: "m" },
  { id: 152, german: "die Genehmigung", english: "the approval", example: "Wir warten auf die Genehmigung.", gender: "f" },
  { id: 153, german: "der Schwerpunkt", english: "the focus", example: "Der Schwerpunkt liegt auf der Sprache.", gender: "m" },
  { id: 154, german: "das Bedürfnis", english: "the need", example: "Es ist ein Grundbedürfnis.", gender: "n" },
  { id: 155, german: "die Mangelware", english: "scarce goods", example: "Gute Mitarbeiter sind Mangelware.", gender: "f" },
  { id: 156, german: "die Herkunft", english: "the origin", example: "Seine Herkunft ist unbekannt.", gender: "f" },
  { id: 157, german: "der Umsatz", english: "the revenue", example: "Der Umsatz ist gestiegen.", gender: "m" },
  { id: 158, german: "die Umsetzung", english: "the implementation", example: "Die Umsetzung war schwierig.", gender: "f" },
  { id: 159, german: "das Engagement", english: "the commitment", example: "Danke für dein Engagement.", gender: "n" },
  { id: 160, german: "die Einschränkung", english: "the restriction", example: "Es gibt keine Einschränkungen.", gender: "f" },
  { id: 161, german: "der Bestandteil", english: "the component", example: "Das ist ein fester Bestandteil.", gender: "m" },
  { id: 162, german: "die Sichtweise", english: "the viewpoint", example: "Das ist eine interessante Sichtweise.", gender: "f" },
  { id: 163, german: "die Erwartungshaltung", english: "the expectation attitude", example: "Die Erwartungshaltung ist zu hoch.", gender: "f" },
  { id: 164, german: "das Hindernis", english: "the obstacle", example: "Ein großes Hindernis steht im Weg.", gender: "n" },
  { id: 165, german: "die Anforderung", english: "the requirement", example: "Die Anforderungen sind gestiegen.", gender: "f" },
  { id: 166, german: "die Kompetenz", english: "the competence", example: "Er hat hohe soziale Kompetenz.", gender: "f" },
  { id: 167, german: "der Wandel", english: "the change", example: "Der Wandel der Zeit.", gender: "m" },
  { id: 168, german: "der Zweifel", english: "the doubt", example: "Ich habe keine Zweifel.", gender: "m" },
  { id: 169, german: "die Absicht", english: "the intention", example: "Das war nicht meine Absicht.", gender: "f" },
  { id: 170, german: "der Zugriff", english: "the access", example: "Ich habe keinen Zugriff auf die Daten.", gender: "m" },
  { id: 171, german: "die Gelegenheit nutzen", english: "to seize the opportunity", example: "Er nutzte die Gelegenheit sofort.", gender: "phrase" },
  { id: 172, german: "der Umgang", english: "the handling/contact", example: "Der Umgang mit schwierigen Kunden.", gender: "m" },
  { id: 173, german: "die Anleitung", english: "the instruction", example: "Lies die Anleitung genau.", gender: "f" },
  { id: 174, german: "der Begriff", english: "the term/concept", example: "Dieser Begriff ist mir neu.", gender: "m" },
  { id: 175, german: "die Datei", english: "the file (digital)", example: "Speichern Sie die Datei ab.", gender: "f" },
  { id: 176, german: "die Frist", english: "the deadline", example: "Die Frist endet morgen.", gender: "f" },
  { id: 177, german: "die Gebühr", english: "the fee", example: "Die Gebühr beträgt 10 Euro.", gender: "f" },
  { id: 178, german: "der Geschmack", english: "the taste", example: "Über Geschmack lässt sich streiten.", gender: "m" },
  { id: 179, german: "die Gewohnheit", english: "the habit", example: "Alte Gewohnheiten legt man schwer ab.", gender: "f" },
  { id: 180, german: "die Hürde", english: "the hurdle", example: "Wir müssen noch einige Hürden nehmen.", gender: "f" },
  { id: 181, german: "der Inhalt", english: "the content", example: "Der Inhalt des Buches ist komplex.", gender: "m" },
  { id: 182, german: "die Kraft", english: "the strength/power", example: "Mir fehlt die Kraft dazu.", gender: "f" },
  { id: 183, german: "die Kritik", english: "the criticism", example: "Er kann keine Kritik vertragen.", gender: "f" },
  { id: 184, german: "die Lage", english: "the situation/location", example: "Die Lage ist ernst.", gender: "f" },
  { id: 185, german: "der Mangel", english: "the lack/defect", example: "Es herrscht ein Mangel an Ärzten.", gender: "m" },
  { id: 186, german: "die Menge", english: "the quantity/crowd", example: "Eine große Menge Menschen.", gender: "f" },
  { id: 187, german: "die Methode", english: "the method", example: "Wir brauchen eine neue Methode.", gender: "f" },
  { id: 188, german: "das Motiv", english: "the motive/motif", example: "Das Motiv des Täters ist unklar.", gender: "n" },
  { id: 189, german: "die Nachricht", english: "the news/message", example: "Ich habe eine gute Nachricht.", gender: "f" },
  { id: 190, german: "die Phase", english: "the phase", example: "Das ist nur eine Phase.", gender: "f" },
  { id: 191, german: "das Prinzip", english: "the principle", example: "Aus Prinzip mache ich das nicht.", gender: "n" },
  { id: 192, german: "die Reaktion", english: "the reaction", example: "Seine Reaktion war überraschend.", gender: "f" },
  { id: 193, german: "die Regel", english: "the rule", example: "Halten Sie sich an die Regeln.", gender: "f" },
  { id: 194, german: "die Rolle", english: "the role", example: "Geld spielt keine Rolle.", gender: "f" },
  { id: 195, german: "die Schwierigkeit", english: "the difficulty", example: "Wir hatten einige Schwierigkeiten.", gender: "f" },
  { id: 196, german: "die Sicherheit", english: "the safety/security", example: "Sicherheit geht vor.", gender: "f" },
  { id: 197, german: "der Standpunkt", english: "the point of view", example: "Vertreten Sie Ihren Standpunkt.", gender: "m" },
  { id: 198, german: "die Struktur", english: "the structure", example: "Die Struktur der Firma wird geändert.", gender: "f" },
  { id: 199, german: "das System", english: "the system", example: "Das System ist abgestürzt.", gender: "n" },
  { id: 200, german: "der Überblick", english: "the overview", example: "Ich habe den Überblick verloren.", gender: "m" }
];

const FULL_VOCAB_DATA = INITIAL_VOCAB_DATA;

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

// --- UTILS ---
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const speak = (text, langCode = 'de-DE') => {
  if (!text) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode; // 使用傳入的語言代碼
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

// ADDED: successStreak field to track Master progress
const normalizeVocabItem = (item) => ({
  ...item,
  status: item.status ?? STATUS.NEW,
  familiarity: item.familiarity || 0,
  learningProgress: item.learningProgress || { sentence: 0, select: 0, listening: 0, spelling: 0 },
  reviewProgress: item.reviewProgress || { spelling: 0, select: 0, reverseSelect: 0 },
  hellProgress: item.hellProgress || { spelling: 0, listening: 0 },
  reviewDates: item.reviewDates || [], 
  isNigate: item.isNigate || false,
  isStarred: item.isStarred || false,
  isCustomized: item.isCustomized || false,
  isDeleted: item.isDeleted || false, 
  successStreak: item.successStreak || 0, // NEW: Track consecutive review successes
  lastReviewed: item.lastReviewed || 0
});

// --- SUB-COMPONENTS (Session Games) ---

const StudyCardPreview = ({ card, onReady, langCode }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 animate-in fade-in zoom-in duration-300">
            <div className="text-center max-w-sm w-full bg-white p-8 rounded-2xl shadow-xl border-2 border-indigo-100">
                <div className="mb-4">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">New Word</span>
                </div>
                <h2 className="text-4xl font-bold text-slate-800 mb-2">{card.german}</h2>
                <div className="flex justify-center gap-2 mb-6">
                    <span className="text-sm text-slate-500 italic">{card.gender === 'm' ? 'der' : card.gender === 'f' ? 'die' : card.gender === 'n' ? 'das' : card.gender}</span>
                    <button onClick={() => speak(card.german, langCode)} className="text-indigo-500 hover:text-indigo-700"><Volume2 className="w-5 h-5"/></button>
                </div>
                <div className="w-full h-px bg-slate-100 my-4"></div>
                <h3 className="text-2xl font-medium text-slate-600 mb-6">{card.english}</h3>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-600 italic text-sm mb-8 border-l-4 border-indigo-300 text-left">
                    "{card.example}"
                </div>
                <button 
                    onClick={onReady}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                    <CheckCircle className="w-5 h-5" /> I've learned it
                </button>
            </div>
        </div>
    );
}

const SentenceFillGame = ({ card, options, onAnswer, feedbackState, selectedOption }) => {
  const getSentenceParts = () => {
      const sentence = card.example;
      const target = card.german;
      let regex = new RegExp(`(${target})`, 'gi');
      if (regex.test(sentence)) return sentence.split(regex);
      const cleanTarget = target.replace(/^(der|die|das|den|dem|des|ein|eine)\s+/i, '').replace(/^(sich)\s+/i, '').replace(/\s+(sich)$/i, '').trim();
      let stem = cleanTarget;
      if (cleanTarget.length > 4) stem = cleanTarget.substring(0, cleanTarget.length - 2); 
      if (stem.length >= 3) {
          regex = new RegExp(`(\\b${stem}[a-zäöüß]*\\b)`, 'gi');
          if (regex.test(sentence)) return sentence.split(regex);
      }
      return [sentence]; 
  };
  const parts = getSentenceParts();

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-indigo-500 font-bold mb-4 tracking-wider">Complete the Sentence</div>
      <div className="text-xl text-center text-slate-700 font-medium mb-8 leading-relaxed max-w-lg bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {parts.map((part, i) => {
           const isMatch = parts.length > 1 && i % 2 !== 0;
           if (isMatch && feedbackState === 'correct') return <span key={i} className="text-green-600 font-bold">{part}</span>;
           if (isMatch && feedbackState === 'wrong') return <span key={i} className="text-red-600 font-bold">{part}</span>;
           return isMatch 
             ? <span key={i} className="inline-block w-24 border-b-2 border-indigo-400 mx-1 align-bottom"></span> 
             : <span key={i}>{part}</span>
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {options.map(opt => {
           let btnClass = "bg-white border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50";
           if (feedbackState) {
               if (opt.id === card.id) btnClass = "bg-green-100 border-2 border-green-500 text-green-800";
               else if (opt.id === selectedOption) btnClass = "bg-red-100 border-2 border-red-500 text-red-800";
               else btnClass = "bg-slate-50 border-2 border-slate-100 text-slate-400 opacity-50";
           }
           return (
             <button key={opt.id} onClick={() => !feedbackState && onAnswer(opt.id, opt.id === card.id)} className={`p-4 rounded-xl transition-all font-medium text-slate-700 ${btnClass}`}>{opt.german}</button>
           );
        })}
      </div>
    </div>
  );
};

// [新增] 專門給 Learning/Review Session 用的句子重組遊戲
const SessionSentenceBuilder = ({ card, onAnswer, feedbackState }) => {
  const [scrambledWords, setScrambledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  
  // 初始化：將例句拆解並打亂
  useEffect(() => {
    // 簡單的防呆：確保有例句
    const sentence = card.example || card.german; 
    const words = sentence.split(' ').map((text, id) => ({ id, text }));
    setScrambledWords(shuffleArray(words));
    setSelectedWords([]);
  }, [card]);

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
    // 寬容度處理：去除標點符號後比對，或者直接嚴格比對
    // 這裡採用嚴格比對，但去除了頭尾空白
    const isCorrect = currentString.trim() === card.example.trim();
    
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
              Correct: {card.example}
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

const ReverseSelectGame = ({ card, options, onAnswer, feedbackState, selectedOption }) => {
  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-purple-500 font-bold mb-2 tracking-wider">German to English</div>
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

const ListeningGame = ({ card, options, onAnswer, feedbackState, selectedOption, timeLimit = 4 }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  useEffect(() => {
    // Reset timer when card changes
    setTimeLeft(timeLimit);
  }, [card, timeLimit]);

  useEffect(() => {
    // Only speak initially if NOT checking answer yet
    if (!feedbackState) {
        speak(card.german);
        const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 0.1)), 100);
        return () => clearInterval(timer);
    }
  }, [card, feedbackState]);
  
  useEffect(() => { if (timeLeft === 0 && !feedbackState) onAnswer(null, false); }, [timeLeft, onAnswer, feedbackState]);

  return (
    <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-sm uppercase text-pink-500 font-bold mb-6 tracking-wider">Listening Challenge</div>
      <button onClick={() => speak(card.german)} className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-6 hover:scale-105 transition-transform shadow-lg border-4 border-pink-200"><Volume2 className="w-10 h-10" /></button>
      <div className="w-full max-w-xs h-2 bg-slate-200 rounded-full mb-8 overflow-hidden"><div className="h-full bg-pink-500 transition-all duration-100 ease-linear" style={{ width: `${(timeLeft / timeLimit) * 100}%` }}/></div>
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

const SpellingGame = ({ card, onAnswer, feedbackState }) => {
  const [input, setInput] = useState('');

  // FIX: Reset input when card ID changes to ensure clean slate
  useEffect(() => { setInput(''); }, [card.id]); // Note: In SessionController, we force a key update so this always runs
  
  const check = () => {
    // FIX: Remove spaces for lenient matching
    const cleanInput = input.trim().toLowerCase().replace(/\s/g, '');
    const cleanTarget = card.german.toLowerCase().replace(/\s/g, '');
    const correct = cleanInput === cleanTarget;
    speak(card.german); 
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
            onKeyDown={e => e.key === 'Enter' && !feedbackState && check()}
            className={`w-full p-4 text-center text-xl border-2 rounded-xl outline-none mb-4 transition-all ${
                feedbackState === 'correct' ? 'border-green-500 bg-green-50 text-green-700' :
                feedbackState === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' :
                'border-slate-200 focus:border-teal-500'
            }`}
            placeholder="Type in German..." 
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
          <div className="flex gap-2 mb-6">{['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map(char => (<button key={char} onClick={() => setInput(prev => prev + char)} className="w-8 h-8 bg-white border shadow-sm rounded hover:bg-slate-50 font-medium">{char}</button>))}</div>
      )}

      {!feedbackState && (
          <button onClick={check} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg">Check</button>
      )}
    </div>
  );
};

// --- CORE SESSION CONTROLLER ---
const SessionController = ({ vocabList, mode, onComplete, onUpdateItem, langCode }) => {
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

  useEffect(() => {
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
       
      const withProgress = driftingPool.filter(i => 
          (i.reviewProgress?.select > 0 || i.reviewProgress?.spelling > 0)
      );
      const noProgress = driftingPool.filter(i => 
          (!i.reviewProgress?.select && !i.reviewProgress?.spelling)
      );

      if (withProgress.length >= 10) {
          candidates = shuffleArray(withProgress).slice(0, 10);
      } else {

          const needed = 10 - withProgress.length;
          candidates = [
              ...withProgress,
              ...shuffleArray(noProgress).slice(0, needed)
          ];
        }
    } else if (mode === 'hell') {
       candidates = shuffleArray(activeList.filter(i => i.isNigate)).slice(0, 4);
    }

    if (candidates.length === 0) { onComplete([]); return; }

    const stats = {};
    candidates.forEach(c => { stats[c.id] = { appearances: 0 }; });
    setSessionStats(stats);
    setActivePool(candidates);
    pickNext(candidates, stats);
  }, []);

  const pickNext = (pool, stats) => {
      if (pool.length === 0) {
          setIsFinished(true);
          return;
      }
      const nextCard = pool[Math.floor(Math.random() * pool.length)];
      setCurrentCard(nextCard);
      // Increment step to ensure unique component key
      setSessionStep(prev => prev + 1);
      
      if (mode === 'learning' && nextCard.status === STATUS.NEW && (stats[nextCard.id]?.appearances || 0) === 0) {
          setShowPreview(true);
      } else {
          initTaskForCard(nextCard, vocabList);
      }
  };

  const initTaskForCard = (card, list) => {
      const task = getTaskForCard(card);
      setActiveTask(task);
      // FIX: Distractors should not be deleted items
      const distractors = list.filter(i => i.id !== card.id && !i.isDeleted).sort(() => 0.5 - Math.random()).slice(0, 3);
      let ops = shuffleArray([card, ...distractors]);
      if (!ops.find(o => o.id === card.id)) ops = [card, ...distractors];
      setCurrentOptions(ops);
  };

  const getTaskForCard = (card) => {
    if (!card) return null;
    if (mode === 'hell') {
        if (card.hellProgress.spelling < 3) return 'spelling';
        if (card.hellProgress.listening < 2) return 'listening';
        return null; 
    }
    if (mode === 'review') {
        const p = card.reviewProgress;
        const revCount = p.reverseSelect || 0; 
      
        let tasks = [];
        if (p.select < 2) tasks.push('select');
        if (p.spelling < 2) tasks.push('spelling');
        if (revCount < 2) tasks.push('reverseSelect');

        if (tasks.length > 0) return tasks[Math.floor(Math.random() * tasks.length)];
        return null;
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
    return null;
  };

  const checkPromotion = (card) => {
      if (mode === 'learning') {
          const p = card.learningProgress;
          return p.sentence >= PROMOTION_REQ.sentence && 
                 p.select >= PROMOTION_REQ.select && 
                 p.listening >= PROMOTION_REQ.listening && 
                 p.spelling >= PROMOTION_REQ.spelling;
      }
      if (mode === 'review') {
          return card.reviewProgress.select >= 2 && 
          card.reviewProgress.spelling >= 2 && 
          (card.reviewProgress.reverseSelect || 0) >= 2;
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
    
    if (activeTask !== 'spelling' && activeTask !== 'listening') speak(currentCard.german);

    // set the time between the questions (the time to pronounce the answer)
    let transitionDelay = 1500; 


    if (activeTask === 'sentence') {
        speak(currentCard.example);
        transitionDelay = 4000; 
        
    } else if (activeTask !== 'spelling' && activeTask !== 'listening') {
        speak(currentCard.german);
        transitionDelay = 1500;
    }

    setTimeout(() => {
        const stats = sessionStats[currentCard.id] || { failures: 0, appearances: 0 };
        const newAppearances = stats.appearances + 1;
        const currentFailures = stats.failures + (isCorrect ? 0 : 1);
        const updatedStats = { ...sessionStats, [currentCard.id]: { failures: currentFailures, appearances: newAppearances } };
        setSessionStats(updatedStats);

        let updatedCard = { ...currentCard, lastInteraction: Date.now() };
        let nextPool = [...activePool];
        
        if (mode === 'hell') {
            if (isCorrect) {
                if (activeTask === 'spelling') updatedCard.hellProgress.spelling++;
                if (activeTask === 'listening') updatedCard.hellProgress.listening++;
                
                if (updatedCard.hellProgress.spelling >= 3 && updatedCard.hellProgress.listening >= 2) {
                    updatedCard.isNigate = false;
                    updatedCard.hellProgress = { spelling: 0, listening: 0 };
                    if (updatedCard.status > STATUS.LEARNING) {
                      updatedCard.status = STATUS.REVIEW;
                    }
                    nextPool = nextPool.filter(c => c.id !== updatedCard.id);
                    setPromotedIds(prev => [...prev, updatedCard]);
                    onUpdateItem(updatedCard);
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
               }
            } else {
                updatedCard.cumulativeFailures = (updatedCard.cumulativeFailures || 0) + 1;
            }

            if (updatedCard.cumulativeFailures >= 2 && !updatedCard.isNigate) {
                updatedCard.isNigate = true;
                updatedCard.successStreak = 0; // Reset streak on Nigate
            }

            const isPromoted = checkPromotion(updatedCard);
            const isSessionMax = newAppearances >= SESSION_APPEARANCE_LIMIT;
            
            onUpdateItem(updatedCard); 

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
            } else if (isSessionMax) {
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
                            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Dropped (Hell Mode) ({failedIds.length})</h3>
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
                  {mode === 'hell' ? 'Nigate Cleared!' : isMasterPromotion ? 'MASTERED!' : 'Promoted!'}
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
          <button onClick={onComplete} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
          <div className="flex items-center gap-2">
              {mode === 'hell' && <Flame className="w-5 h-5 text-red-500 animate-pulse" />}
              <span className="font-bold text-slate-700 uppercase text-sm tracking-wide">{mode} Session</span>
          </div>
          <div className="w-6"></div>
       </div>
       {mode !== 'hell' && (
           <div className="h-1 bg-slate-200 w-full"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((5 - (sessionStats[currentCard.id]?.appearances || 0)) / 5) * 100}%` }} /></div>
       )}
       <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto relative">
           {currentCard.isNigate && mode !== 'hell' && (<div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-full"><Skull className="w-3 h-3" /> NIGATE</div>)}
           {activeTask === 'sentence' && (
               <SessionSentenceBuilder 
                   key={currentCard.id + 'sen' + sessionStep} 
                   card={currentCard} 
                   onAnswer={handleAnswer} 
                   feedbackState={feedbackState} 
               />
           )}
           {activeTask === 'select' && <SelectCardGame key={currentCard.id + 'sel' + sessionStep} card={currentCard} options={currentOptions} onAnswer={handleAnswer} feedbackState={feedbackState} selectedOption={selectedOption} />}
           {activeTask === 'reverseSelect' && <ReverseSelectGame key={currentCard.id + 'rev' + sessionStep} card={currentCard} options={currentOptions} onAnswer={handleAnswer} feedbackState={feedbackState} selectedOption={selectedOption} />}
           {activeTask === 'listening' && <ListeningGame key={currentCard.id + 'lis' + sessionStep} card={currentCard} options={currentOptions} onAnswer={handleAnswer} feedbackState={feedbackState} selectedOption={selectedOption} />}
           {/* FIX: Add sessionStep to key to force reset on re-render of same word */}
           {activeTask === 'spelling' && <SpellingGame key={currentCard.id + 'spe' + sessionStep} card={currentCard} onAnswer={handleAnswer} feedbackState={feedbackState} />}
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
const FlashcardGame = ({ onBack, vocabList, onUpdateItem }) => {
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

  useEffect(() => { if (!isActive && !isGameOver && vocabList.length > 0) nextRound(); }, [vocabList]);

  useEffect(() => {
      if (isActive && timeLeft > 0 && !isGameOver && !processing) {
          const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
          return () => clearInterval(timer);
      } else if (isActive && timeLeft <= 0 && !isGameOver && !processing) {
          handleTimeout();
      }
  }, [isActive, timeLeft, nextRound, isGameOver, processing]);

  const handleTimeout = () => {
      const newLives = lives - 1;
      setLives(newLives);
      setTestedWords(prev => [...prev, { ...currentCard, correct: false }]);
      if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
  };

  const handleAnswer = (option) => {
      if (processing) return; 
      setProcessing(true);
      const correct = option.id === currentCard.id;
      setSelectedOptionId(option.id);
      setFeedback(correct ? 'correct' : 'wrong');
      speak(currentCard.german);
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
              <button onClick={onBack}><ArrowRight className="rotate-180 w-6 h-6 text-slate-400"/></button>
              <div className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />))}</div>
              <div className="font-bold text-indigo-600 text-xl">{score}</div>
          </div>
          <div className="h-2 bg-slate-200"><div className="h-full bg-red-500 transition-all duration-100 linear" style={{ width: `${(timeLeft/4)*100}%` }}></div></div>
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
const ReverseBlitzGame = ({ onBack, vocabList, onUpdateItem }) => {
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

  useEffect(() => { if (!isActive && !isGameOver && vocabList.length > 0) nextRound(); }, [vocabList]);

  useEffect(() => {
      if (isActive && timeLeft > 0 && !isGameOver && !processing) {
          const timer = setInterval(() => setTimeLeft(t => t - 0.1), 100);
          return () => clearInterval(timer);
      } else if (isActive && timeLeft <= 0 && !isGameOver && !processing) {
          handleTimeout();
      }
  }, [isActive, timeLeft, nextRound, isGameOver, processing]);

  const handleTimeout = () => {
      const newLives = lives - 1;
      setLives(newLives);
      setTestedWords(prev => [...prev, { ...currentCard, correct: false }]);
      if (newLives <= 0) { setIsGameOver(true); } else { nextRound(); }
  };

  const handleAnswer = (option) => {
      if (processing) return; 
      setProcessing(true);
      const correct = option.id === currentCard.id;
      setSelectedOptionId(option.id);
      setFeedback(correct ? 'correct' : 'wrong');
      
      // Speak the correct German word immediately for reinforcement
      speak(currentCard.german);

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
              <button onClick={onBack}><ArrowRight className="rotate-180 w-6 h-6 text-slate-400"/></button>
              <div className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />))}</div>
              <div className="font-bold text-indigo-600 text-xl">{score}</div>
          </div>
          <div className="h-2 bg-slate-200"><div className="h-full bg-red-500 transition-all duration-100 linear" style={{ width: `${(timeLeft/4)*100}%` }}></div></div>
          <div className="flex-1 flex flex-col justify-center p-6 items-center">
              <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Translate to German</div>
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
const ArcadeListeningGame = ({ onBack, vocabList, onUpdateItem }) => {
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
    
    // Play audio on start of round
    setTimeout(() => speak(target.german), 500); 
  }, [vocabList]);

  useEffect(() => { if (!isActive && !isGameOver && vocabList.length > 0) nextRound(); }, [vocabList]);

  const handleAnswer = (option) => {
      if (processing) return; 
      setProcessing(true);
      const correct = option.id === currentCard.id;
      setSelectedOptionId(option.id);
      setFeedback(correct ? 'correct' : 'wrong');
      
      // Reinforce audio
      speak(currentCard.german);

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
              <button onClick={onBack}><ArrowRight className="rotate-180 w-6 h-6 text-slate-400"/></button>
              <div className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart key={i} className={`w-6 h-6 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />))}</div>
              <div className="font-bold text-pink-600 text-xl">{score}</div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center p-6 items-center">
              <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Listen & Translate</div>
              
              <button 
                onClick={() => speak(currentCard?.german)}
                className="w-32 h-32 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-8 hover:scale-105 transition-transform shadow-lg border-4 border-pink-200"
              >
                <Volume2 className="w-12 h-12" />
              </button>

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

  const initializeGame = () => {
    if (vocabList.length === 0) return;
    const learnedWords = vocabList.filter(w => (w.familiarity || 0) > 0);
    const sourceList = learnedWords.length >= 8 ? learnedWords : vocabList;
    const selectedWords = shuffleArray(sourceList).slice(0, 8);
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
  };

  useEffect(() => { if (gamePhase === 'init') initializeGame(); }, []);

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
            if (newMatched.length === 8) setIsGameOver(true);
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
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180 w-5 h-5"/></button>
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
              <div key={card.uniqueId} onClick={() => handleCardClick(index)} className="relative cursor-pointer aspect-square perspective-1000 group">
                <div className={`w-full h-full transition-all duration-300 transform style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                  <div className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm backface-hidden flex items-center justify-center border-2 border-indigo-400"><Grid2X2 className="text-indigo-200 opacity-50 w-6 h-6" /></div>
                  <div className={`absolute inset-0 bg-white rounded-lg shadow-md backface-hidden flex items-center justify-center p-1 text-center border-2 ${isMatched ? 'border-green-400 bg-green-50' : 'border-purple-200'}`} style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                    <span className={`text-xs sm:text-sm font-semibold break-words leading-tight ${isMatched ? 'text-green-700' : 'text-slate-700'}`}>{card.content}</span>
                  </div>
                </div>
              </div>
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
  const [validSentences, setValidSentences] = useState([]);

  useEffect(() => {
    const possible = vocabList.filter(item => item.example && item.example.split(' ').length > 3);
    setValidSentences(possible);
  }, [vocabList]);

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

  if (validSentences.length === 0) return <div className="p-8 text-center">No valid sentences found in this set.</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 shadow-sm flex items-center justify-between">
        <button onClick={onBack} className="text-slate-600"><ArrowRight className="rotate-180 w-5 h-5"/></button>
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
          {feedback === 'correct' && <span className="text-green-600 font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Richtig! Gut gemacht!</span>}
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
const ArcadeSpellingInput = ({ card, onAnswer }) => {
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
  
    const check = () => {
      const cleanInput = input.trim().toLowerCase().replace(/\s/g, '');
      const cleanTarget = card.german.toLowerCase().replace(/\s/g, '');
      const correct = cleanInput === cleanTarget;
      setIsCorrect(correct);
      setChecked(true);
      speak(card.german); 
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
            <input autoFocus value={input} disabled={checked} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !checked && check()} className={`w-full p-4 text-center text-xl border-2 rounded-xl outline-none mb-4 transition-all ${checked ? isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 focus:border-teal-500'}`} placeholder="Type in German..." />
            {checked && <div className={`absolute right-4 top-4 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>{isCorrect ? <CheckCircle className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}</div>}
        </div>
        {checked && !isCorrect && <div className="text-red-500 font-bold mb-4 animate-in fade-in">Correct: {card.german}</div>}
        {!checked && <div className="flex gap-2 mb-6">{['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map(char => (<button key={char} onClick={() => setInput(prev => prev + char)} className="w-8 h-8 bg-white border shadow-sm rounded hover:bg-slate-50 font-medium">{char}</button>))}</div>}
        {!checked && <button onClick={check} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg">Check</button>}
      </div>
    );
  };

const ArcadeSpellingBee = ({ onBack, vocabList, onUpdateItem }) => {
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
                <button onClick={onBack}><ArrowRight className="rotate-180 w-6 h-6"/></button>
                <div className="font-bold text-teal-600">Score: {score}</div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                {/* Use combined Key to force re-render on every turn */}
                <ArcadeSpellingInput key={`${card.id}-${turnCount}`} card={card} onAnswer={handleAnswer} />
            </div>
        </div>
    );
}

const ArcadeContainer = ({ gameType, vocabList, onBack, onUpdateItem }) => {
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
        case 'blitz': return <FlashcardGame vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} />;
        case 'reverse-blitz': return <ReverseBlitzGame vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} />;
        case 'listening': return <ArcadeListeningGame vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} />;
        case 'memory': return <MemoryMatchGame vocabList={playableList} onBack={onBack} />;
        case 'sentence': return <SentenceBuilder vocabList={playableList} onBack={onBack} />;
        case 'spelling': return <ArcadeSpellingBee vocabList={playableList} onBack={onBack} onUpdateItem={onUpdateItem} />;
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
  const [newWord, setNewWord] = useState({ german: '', english: '', gender: 'm', example: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Use the passed language or default to German
  const targetLangLabel = currentLanguage || "German";

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
      return item.gender === filter || (filter === 'v' && item.gender === 'v') || (filter === 'adj' && item.gender === 'adj');
  });

  const saveEdit = () => { onUpdateItem({ ...editForm, isCustomized: true }); setEditingId(null); };
  const saveNew = () => { onAddItem(newWord); setIsAdding(false); setNewWord({ german: '', english: '', gender: 'm', example: '' }); };
  const getStatusColor = (status) => {
      switch(status) {
          case STATUS.MASTERED: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
          case STATUS.DRIFTING: return 'text-orange-600 bg-orange-50 border-orange-200';
          case STATUS.REVIEW: return 'text-green-600 bg-green-50 border-green-200';
          case STATUS.LEARNING: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
          default: return 'text-slate-500 bg-slate-100 border-slate-200';
      }
  };
  const getFilterLabel = (key) => { if (key.startsWith('status-')) return STATUS_LABELS[key.split('-')[1]]; return key; };

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
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder={`Search ${targetLangLabel} vocabulary...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {['all', 'starred', 'nigate', `status-${STATUS.NEW}`, `status-${STATUS.LEARNING}`, `status-${STATUS.REVIEW}`, `status-${STATUS.DRIFTING}`, `status-${STATUS.MASTERED}`, 'm', 'f', 'n', 'v', 'adj', 'adv'].map(type => (
                <button key={type} onClick={() => setFilter(type)} className={`px-4 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap flex items-center gap-1 ${filter === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {type === 'starred' && <Star className="w-3 h-3 fill-current"/>}
                  {type === 'nigate' && <Skull className="w-3 h-3"/>}
                  {getFilterLabel(type)}
                </button>
              ))}
            </div>
            {isAdding && (
                <div className="bg-white p-4 rounded-xl shadow-md border-2 border-indigo-500 mb-4 animate-in fade-in zoom-in">
                    <div className="flex gap-2 mb-2">
                        {/* UPDATE: Uses dynamic placeholder */}
                        <input className="flex-1 p-2 border rounded font-bold" placeholder={targetLangLabel} value={newWord.german} onChange={e => setNewWord({...newWord, german: e.target.value})} />
                        <select className="p-2 border rounded" value={newWord.gender} onChange={e => setNewWord({...newWord, gender: e.target.value})}>
                          <option value="n">Noun (n)</option>
                          <option value="v">Verb (v)</option>
                          <option value="adj">Adjective (adj)</option>
                          <option value="adv">Adverb (adv)</option>
                          <option value="phr">Phrase (phr)</option>
                          <option value="other">Other</option>
                        </select>
                    </div>
                    <input className="w-full p-2 border rounded mb-2" placeholder="English / Native" value={newWord.english} onChange={e => setNewWord({...newWord, english: e.target.value})} />
                    <input className="w-full p-2 border rounded mb-2" placeholder="Example Sentence" value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} />
                    <div className="flex gap-2">
                        <button onClick={saveNew} className="flex-1 bg-green-500 text-white p-2 rounded font-bold">Save</button>
                        <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-200 text-slate-600 p-2 rounded font-bold">Cancel</button>
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {filtered.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group">
                        {editingId === item.id ? (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input className="flex-1 font-bold border-b" value={editForm.german} onChange={e => setEditForm({...editForm, german: e.target.value})}/>
                                    <select className="border-b bg-white" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                                      <option value="n">Noun (n)</option>
                                      <option value="v">Verb (v)</option>
                                      <option value="adj">Adjective (adj)</option>
                                      <option value="adv">Adverb (adv)</option>
                                      <option value="phr">Phrase (phr)</option>
                                      <option value="other">Other</option>
                                    </select>
                                </div>
                                <input className="w-full border-b" value={editForm.english} onChange={e => setEditForm({...editForm, english: e.target.value})}/>
                                <textarea className="w-full border p-1 rounded" value={editForm.example} onChange={e => setEditForm({...editForm, example: e.target.value})}/>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingId(null)} className="text-slate-400">Cancel</button>
                                    <button onClick={saveEdit} className="text-indigo-600 font-bold">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 text-lg">{item.german}</span>
                                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{item.gender}</span>
                                        <button onClick={() => speak(item.german)} className="text-slate-400 hover:text-indigo-600 ml-1"><Volume2 className="w-4 h-4"/></button>
                                        {item.isNigate && <Skull className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="text-slate-500 mb-2">{item.english}</div>
                                    <div className="text-xs text-slate-400 italic mb-2">"{item.example}"</div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(item.status)}`}>{STATUS_LABELS[item.status]}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 absolute top-4 right-4">
                                    <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="text-slate-300 hover:text-indigo-500"><Pencil className="w-4 h-4"/></button>
                                    <button onClick={() => onUpdateItem({ ...item, isStarred: !item.isStarred })} className={item.isStarred ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-400'}><Star className="w-4 h-4 fill-current"/></button>
                                    {confirmDeleteId === item.id ? (
                                        <button onClick={() => { onDeleteItem(item.id); setConfirmDeleteId(null); }} className="text-xs bg-red-500 text-white px-2 py-1 rounded shadow-sm hover:bg-red-600 animate-in zoom-in">Confirm</button>
                                    ) : (
                                        <button onClick={() => setConfirmDeleteId(item.id)} className="text-slate-200 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

// --- DASHBOARD (Strictly Defined Before App) ---
// --- DASHBOARD (修改版：加入 Google 登入) ---
const Dashboard = ({ vocabList, onStartMode, resetProgress, onOpenVocab, user, currentLanguage, onSwitchDeck, onLogin, onLogout }) => {
  // 計算統計數據
  const stats = {
      new: vocabList.filter(i => i.status === STATUS.NEW && !i.isDeleted).length,
      learning: vocabList.filter(i => i.status === STATUS.LEARNING && !i.isDeleted).length,
      review: vocabList.filter(i => i.status === STATUS.REVIEW && !i.isDeleted).length,
      drifting: vocabList.filter(i => i.status === STATUS.DRIFTING && !i.isDeleted).length,
      mastered: vocabList.filter(i => i.status === STATUS.MASTERED && !i.isDeleted).length,
      nigate: vocabList.filter(i => i.isNigate && !i.isDeleted).length
  };

  

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
                          <h1 className="text-2xl font-extrabold tracking-tight">Duanlingo</h1>
                          <p className="text-indigo-200 text-sm font-medium opacity-80">
                            {currentLanguage || 'German'}
                          </p>
                      </div>
                  </div>

                  {/* User Profile / Login */}
                  <div>
                      {user && !user.isAnonymous ? (
                          <button onClick={onLogout} className="group relative">
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
                  <button onClick={() => onOpenVocab('nigate')} className="bg-red-500/20 backdrop-blur-md p-2 rounded-xl text-center border border-red-500/30 hover:bg-red-500/30 transition-colors"><div className="flex justify-center mb-1 text-red-300"><Skull className="w-4 h-4"/></div><span className="block text-xl font-bold">{stats.nigate}</span><span className="text-[10px] uppercase tracking-wider opacity-70">Nigate</span></button>
              </div>
          </div>
          
          {/* Main Action Buttons */}
          <div className="flex-1 p-6 -mt-4 overflow-y-auto space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Core Path</div>
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
                      <div className="text-left flex-1"><h3 className="font-bold text-red-800">Hell Training</h3><p className="text-red-600 text-xs">Clear NIGATE status</p></div>
                      <ArrowRight className="text-red-300 w-5 h-5" />
                  </button>
              )}
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mt-6">Arcade & Tools</div>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onStartMode('arcade-blitz')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2">
                      <Clock className="w-6 h-6 text-blue-500" />
                      <span className="font-bold text-slate-700 text-sm">Blitz</span>
                  </button>
                  <button onClick={() => onStartMode('arcade-reverse-blitz')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2">
                      <Shuffle className="w-6 h-6 text-pink-500" />
                      <span className="font-bold text-slate-700 text-sm">Rev. Blitz</span>
                  </button>
                  <button onClick={() => onStartMode('arcade-listening')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2">
                      <Headphones className="w-6 h-6 text-red-500" />
                      <span className="font-bold text-slate-700 text-sm">Listening</span>
                  </button>
                  <button onClick={() => onStartMode('arcade-memory')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2">
                      <Grid2X2 className="w-6 h-6 text-purple-500" />
                      <span className="font-bold text-slate-700 text-sm">Memory</span>
                  </button>
                  <button onClick={() => onStartMode('arcade-sentence')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2">
                      <Brain className="w-6 h-6 text-orange-500" />
                      <span className="font-bold text-slate-700 text-sm">Sentence</span>
                  </button>
                  <button onClick={() => onStartMode('arcade-spelling')} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 flex flex-col items-center gap-2">
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

// --- APP ROOT ---
// --- APP ROOT (REPLACE THIS ENTIRE COMPONENT) ---
// --- NEW COMPONENT: Deck & Language Manager (Place before App component) ---
const DeckSelector = ({ decks, currentDeckId, onChangeDeck, onAddDeck }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckData, setNewDeckData] = useState({ title: '', language: 'English' });

  const handleCreate = () => {
    if (!newDeckData.title) return;
    onAddDeck(newDeckData.title, newDeckData.language);
    setIsCreating(false);
    setNewDeckData({ title: '', language: 'English' });
  };

  const activeDeck = decks[currentDeckId];

  return (
    <div className="bg-slate-800 text-white p-4 shrink-0">
      <div className="flex justify-between items-center max-w-md mx-auto">
        
        {/* Left: Current Selected Deck */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-indigo-500 p-2 rounded-lg shrink-0">
            <Languages className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Current Deck</span>
            <div className="relative">
                <select 
                value={currentDeckId} 
                onChange={(e) => onChangeDeck(e.target.value)}
                className="bg-transparent font-bold text-lg focus:outline-none cursor-pointer appearance-none text-white w-full pr-4 truncate"
                >
                {Object.values(decks).map(deck => (
                    <option key={deck.id} value={deck.id} className="text-slate-900">
                    {deck.language} - {deck.title}
                    </option>
                ))}
                </select>
            </div>
          </div>
        </div>

        {/* Right: Add Button */}
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full transition-colors shrink-0 shadow-lg border border-indigo-400"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Modal for adding new deck */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-600" /> Create New Deck
            </h3>
            
            <label className="block text-sm font-bold text-slate-500 mb-1">Language</label>
            <select 
              className="w-full p-3 bg-slate-100 rounded-xl mb-4 border border-slate-200 outline-none focus:border-indigo-500"
              value={newDeckData.language}
              onChange={e => setNewDeckData({...newDeckData, language: e.target.value})}
            >
              <option value="German">German (Deutsch)</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="Japanese">Japanese (日本語)</option>
              <option value="Korean">Korean (한국어)</option>
              <option value="Italian">Italian (Italiano)</option>
              <option value="Chinese">Chinese (中文)</option>
            </select>

            <label className="block text-sm font-bold text-slate-500 mb-1">Deck Name</label>
            <input 
              className="w-full p-3 bg-slate-100 rounded-xl mb-6 border border-slate-200 outline-none focus:border-indigo-500"
              placeholder="e.g. Travel Basics..."
              value={newDeckData.title}
              onChange={e => setNewDeckData({...newDeckData, title: e.target.value})}
            />

            <div className="flex gap-3">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
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
];

// --- NEW COMPONENT: Deck Library (The Menu Page) ---
// 修改原本的 DeckLibrary 元件
// 加入 user, onLogin, onLogout 這三個新的 props
// --- 修改後的 DeckLibrary (舊風格 + 刪除功能) ---
const DeckLibrary = ({ decks, onSelectDeck, onAddDeck, onDeleteDeck, user, onLogin, onLogout }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckData, setNewDeckData] = useState({ title: '', language: 'German' });
  const [loadDefault, setLoadDefault] = useState(true);

  const handleCreate = () => {
    if (!newDeckData.title) return;
    onAddDeck(newDeckData.title, newDeckData.language, loadDefault);
    setIsCreating(false);
    setNewDeckData({ title: '', language: 'German' });
    setLoadDefault(true);
  };

  const getLangInfo = (langCode) => SUPPORTED_LANGUAGES.find(l => l.code === langCode) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* 1. Header (保持原本的深色圓弧設計) */}
      <div className="bg-slate-900 text-white p-8 pt-12 pb-16 rounded-b-[3rem] shadow-xl relative z-10 flex flex-col items-center">
         
         {/* User Profile Section */}
         <div className="absolute top-6 right-6">
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

         <h1 className="text-4xl font-extrabold mb-2 tracking-tight mt-4">Your Library</h1>
         <p className="text-slate-400">Select a language deck to start learning</p>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
          {/* Create New Deck Button */}
          <button 
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
              <div 
                key={deck.id} 
                onClick={() => onSelectDeck(deck.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all text-left relative overflow-hidden group cursor-pointer"
              >
                {/* 🚨 DELETE BUTTON (New Feature) */}
                {/* 只有當牌組數量 > 1 時才顯示刪除鈕，或者你想允許刪光也可以 */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // 阻止冒泡：避免點刪除時同時打開牌組
                        onDeleteDeck(deck.id); 
                    }}
                    className="absolute top-3 right-3 z-30 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Deck"
                >
                    <Trash2 className="w-5 h-5" />
                </button>

                <div className="absolute right-0 top-0 p-10 bg-slate-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity -mr-8 -mt-8 pointer-events-none"></div>
                
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal (保持不變) */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white text-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-lg"><Plus className="w-5 h-5 text-indigo-600" /></div>
                New Language Deck
            </h3>
            
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Select Language</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => setNewDeckData({...newDeckData, language: lang.code})}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${newDeckData.language === lang.code ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                    >
                        <div className="text-2xl mb-1">{lang.flag}</div>
                        <div className={`text-xs font-bold ${newDeckData.language === lang.code ? 'text-indigo-700' : 'text-slate-600'}`}>{lang.code}</div>
                    </button>
                ))}
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Deck Name</label>
            <input 
              className="w-full p-4 bg-slate-50 rounded-xl mb-6 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              placeholder="e.g. Travel Basics..."
              value={newDeckData.title}
              onChange={e => setNewDeckData({...newDeckData, title: e.target.value})}
            />

            <div className="flex items-center gap-2 mb-6 ml-1 cursor-pointer" onClick={() => setLoadDefault(!loadDefault)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${loadDefault ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {loadDefault && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-bold text-slate-600">Load starter vocabulary (15 words)</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all transform active:scale-95">Create Deck</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  const currentDeck = decks[currentDeckId] || Object.values(decks)[0] || { words: [], language: 'German' };
  const currentSpeechCode = SUPPORTED_LANGUAGES.find(l => l.code === currentDeck.language)?.speechCode || 'de-DE';
  const vocabList = currentDeck.words || [];

  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVideoDone, setIsVideoDone] = useState(false);

  // [Ref] Back up current Decks state for anonymous data migration upon login
  const decksRef = useRef(decks); 
  useEffect(() => { decksRef.current = decks; }, [decks]);

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    setDb(firestore);
  
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthReady(true);
      } else {
        await signInAnonymously(auth);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Core Data Sync & Migration Logic (Smart Auto-Restore)
  // [Logic] Checks if v8 (new) data is empty. If so, forces a check for v7 (old) data to auto-migrate.
  // 2. Core Data Sync & Migration Logic (Smart Auto-Restore)
  
  // 2. Core Data Sync (Clean Version - No Migration)
  useEffect(() => {
    if (!authReady || !db || !user) return;
    setLoading(true);
    
    // 使用新的路徑
    const docRef = doc(db, 'users', user.uid, 'data', 'vocab_multilingua_v1');
    
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        // --- CASE A: 載入現有資料 (Load Existing) ---
        console.log("Loading Cloud Data...");
        const data = docSnap.data();
        
        // 簡單的防呆：確認資料格式大致正確
        if (data && data.decks) {
             setDecks(data.decks);
             // 如果找不到 currentDeckId，就預設用第一個 deck
             const firstDeckId = Object.keys(data.decks)[0];
             setCurrentDeckId(data.currentDeckId || firstDeckId);
        }
        setLoading(false);

      } else {
        // --- CASE B: 全新用戶初始化 (Fresh Start) ---
        // 這裡完全不管舊資料，直接給他一套全新的德語牌組
        console.log("No data found. Initializing new user...");
        
        // const initDeckId = 'german_core';
        const initDecks = {};

        // 直接寫入資料庫
        await setDoc(docRef, { 
          decks: initDecks, 
          currentDeckId: null,
          lastUpdated: new Date().toISOString() 
        });
        
        // 設定本地 State
        setDecks(initDecks);
        setCurrentDeckId(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [authReady, db, user]);

  // 3. Save Function
  const saveToCloud = async (newDecks, activeId) => {
    if (!db || !user) return;
    setIsSaving(true);
    try {
      // 確保這裡的路徑跟上面 useEffect 的路徑一模一樣！
      const docRef = doc(db, 'users', user.uid, 'data', 'vocab_multilingua_v1');
      
      await setDoc(docRef, { 
          decks: newDecks, 
          currentDeckId: activeId || currentDeckId,
          lastUpdated: new Date().toISOString() 
      });
    } catch (e) { 
        console.error("Save Error:", e);
    } finally {
        setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login failed", error);
        alert("Login failed: " + error.message);
    }
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
         // 登出後，會觸發 useEffect 的 onAuthStateChanged
         // 那裡會自動把你登入為「匿名帳戶」，這就達到了「換一個帳號」的效果
         // 並且我們強制回到 DeckLibrary 畫面
         setView('decks');
         window.location.reload(); // 重整頁面最乾淨
    });
  };

  // 4. CRUD Handlers 
  const handleUpdateItem = (updatedItem) => {
      setDecks(prevDecks => {
          const targetDeck = prevDecks[currentDeckId];
          const newWords = targetDeck.words.map(i => i.id === updatedItem.id ? updatedItem : i);
          const newDecks = {
              ...prevDecks,
              [currentDeckId]: { ...targetDeck, words: newWords }
          };
          saveToCloud(newDecks, currentDeckId); 
          return newDecks;
      });
  };

  const handleDeleteItem = (id) => {
      setDecks(prevDecks => {
        const targetDeck = prevDecks[currentDeckId];
        const newWords = targetDeck.words.map(i => i.id === id ? { ...i, isDeleted: true } : i);
        const newDecks = {
            ...prevDecks,
            [currentDeckId]: { ...targetDeck, words: newWords }
        };
        saveToCloud(newDecks, currentDeckId);
        return newDecks;
      });
  };

  const handleAddItem = (newItem) => {
      setDecks(prevDecks => {
          const targetDeck = prevDecks[currentDeckId];
          const maxId = targetDeck.words.reduce((acc, curr) => Math.max(acc, curr.id), 1000);
          const item = normalizeVocabItem({ ...newItem, id: maxId + 1, isCustomized: true });
          
          const newDecks = {
              ...prevDecks,
              [currentDeckId]: { ...targetDeck, words: [item, ...targetDeck.words] }
          };
          saveToCloud(newDecks, currentDeckId);
          return newDecks;
      });
  };

  // 修改 App 元件內的 handleAddDeck，接收 loadDefaults 參數
  const handleAddDeck = (title, language, loadDefaults) => {
    const newId = `deck_${Date.now()}`;
    
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
    
    setDecks(prev => {
        const next = { ...prev, [newId]: newDeck };
        saveToCloud(next, newId); 
        return next;
    });
    setCurrentDeckId(newId);
    
    // 如果有預設單字，直接回 Dashboard，不然去 Vocab 頁面加字
    setView('home');
  };

  // --- 在 App 元件內 (handleAddDeck 下方) ---

  // --- 修改後的 handleDeleteDeck (允許刪光光) ---
  const handleDeleteDeck = (deckId) => {
    // 1. 【已移除】原本的「至少留一個」限制
    // if (deckKeys.length <= 1) ... (這段被拿掉了)

    // 2. 確認刪除
    if (!confirm("Are you sure you want to delete this deck? This cannot be undone.")) {
        return;
    }

    const deckKeys = Object.keys(decks);
    
    // 3. 計算刪除後的「下一個作用中牌組 ID」
    // 如果還有別的牌組，就選別的；如果刪光了，就是 null
    const remainingKeys = deckKeys.filter(k => k !== deckId);
    let nextActiveId = currentDeckId;

    if (deckId === currentDeckId) {
        // 如果刪掉的是當前正在看的，那就要換一個
        nextActiveId = remainingKeys.length > 0 ? remainingKeys[0] : null;
        setCurrentDeckId(nextActiveId);
    }

    // 4. 執行刪除
    setDecks(prev => {
        const newDecks = { ...prev };
        delete newDecks[deckId];
        
        // 存檔 (如果 nextActiveId 是 null，就存 null，這樣下次進來就不會亂選)
        saveToCloud(newDecks, nextActiveId);
        
        return newDecks;
    });

    // 5. 【關鍵保護機制】
    // 如果刪光了 (nextActiveId 為 null)，或者刪掉的是當前牌組
    // 強制跳轉回 'decks' (圖書館頁面)，避免停留在 Dashboard 導致崩潰
    if (!nextActiveId || deckId === currentDeckId) {
        setView('decks');
    }
  };

  const handleSelectDeck = (deckId) => {
    setCurrentDeckId(deckId);
    saveToCloud(decks, deckId);
    setView('home'); // 選完牌組後，進入 Dashboard
  };

  const handleHardReset = async () => {
    if(confirm("Reset ENTIRE deck to defaults? This cannot be undone.")) {
        const resetDeck = {
            ...currentDeck,
            words: FULL_VOCAB_DATA.map(normalizeVocabItem)
        };
        setDecks(prev => {
            const next = { ...prev, [currentDeckId]: resetDeck };
            saveToCloud(next, currentDeckId);
            return next;
        });
    }
  };

  const handleOpenVocab = (filter) => { setVocabFilter(filter); setView('vocab'); };
  const [vocabFilter, setVocabFilter] = useState('all');

  if (loading || !isVideoDone) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <video
          autoPlay muted playsInline
          onEnded={() => setIsVideoDone(true)} 
          className="absolute inset-0 w-full h-full object-contain"
        >
          <source src="/loading.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
  <div className="h-screen w-full bg-slate-200 flex items-center justify-center font-sans">
    <div className="w-full max-w-md h-full md:h-[90vh] bg-white md:rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col">
        
        {isSaving && (
            <div className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-2 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </div>
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
                  resetProgress={handleHardReset} 
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
                  onComplete={() => setView('home')}
                  onUpdateItem={handleUpdateItem}
              />
          )}

          {view.startsWith('arcade-') && (
              <ArcadeContainer 
                  vocabList={vocabList} 
                  gameType={view.replace('arcade-', '')}
                  langCode={currentSpeechCode}
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