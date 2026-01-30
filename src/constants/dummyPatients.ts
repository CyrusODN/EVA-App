// Dummy patient data for template simulation
// Used to demonstrate how templates will work with real patient data

export interface DummyPatient {
  name: string;
  age: number;
  diagnosis: string;
  meds: string[];
  history: string;
}

export const DUMMY_PATIENTS: Record<string, DummyPatient> = {
  'Psychiatry': {
    name: 'JK87',
    age: 42,
    diagnosis: 'Epizod depresyjny umiarkowany (F32.1)',
    meds: ['Sertraline 50mg', 'Lorazepam 0.5mg PRN'],
    history: 'Pierwsza wizyta kontrolna po 2 tygodniach leczenia. Pacjent zgłasza poprawę nastroju i normalizację snu.',
  },
  'Child Psychiatry': {
    name: 'MN03',
    age: 14,
    diagnosis: 'ADHD (F90.0)',
    meds: ['Methylphenidate 10mg'],
    history: 'Kontrola po 1 miesiącu leczenia. Rodzice zgłaszają spadek apetytu, ale poprawę koncentracji w szkole.',
  },
  'Surgery': {
    name: 'AW55',
    age: 55,
    diagnosis: 'Kamica żółciowa (K80.2)',
    meds: ['Ketoprofen 100mg PRN'],
    history: 'Kwalifikacja do cholecystektomii laparoskopowej. USG potwierdza obecność złogów.',
  },
  'Smart Select': {
    name: 'Piotr Zieliński',
    age: 35,
    diagnosis: 'Wizyta kontrolna',
    meds: [],
    history: 'Ogólna konsultacja medyczna. Pacjent zgłasza się z rutyną kontrolą stanu zdrowia.',
  },
};

// Generate sample note based on template instructions and patient data
export const generateSampleNote = (
  templateInstructions: string,
  patient: DummyPatient
): string => {
  // This is a mock implementation. In production, this would call the AI backend
  const { name, age, diagnosis, meds, history } = patient;
  
  // Determine note style based on instructions (simplified logic)
  const isConcise = templateInstructions.toLowerCase().includes('krótk') || 
                   templateInstructions.toLowerCase().includes('zwięz') ||
                   templateInstructions.toLowerCase().includes('short') ||
                   templateInstructions.toLowerCase().includes('concise');
  
  const focusMeds = templateInstructions.toLowerCase().includes('lek') ||
                   templateInstructions.toLowerCase().includes('med') ||
                   templateInstructions.toLowerCase().includes('farmako');
  
  const skipFamily = templateInstructions.toLowerCase().includes('bez historii rodzinnej') ||
                    templateInstructions.toLowerCase().includes('pomiń histori') ||
                    templateInstructions.toLowerCase().includes('without family');

  if (isConcise && focusMeds) {
    return `PACJENT: ${name}, ${age} lat
ROZPOZNANIE: ${diagnosis}

LEKI:
${meds.length > 0 ? meds.map(m => `• ${m}`).join('\n') : '• Brak stałych leków'}

OCENA: Stan stabilny, kontynuacja dotychczasowego leczenia.
KONTROLA: Za 4 tygodnie.`;
  }
  
  if (isConcise) {
    return `• Wizyta kontrolna - ${diagnosis}
• ${history}
• ${meds.length > 0 ? `Leki: ${meds.join(', ')}` : 'Brak leków'}
• Kontrola: 4 tygodnie`;
  }
  
  // Default detailed note
  return `DANE PACJENTA
Imię i nazwisko: ${name}
Wiek: ${age} lat

WYWIAD
${history}

ROZPOZNANIE
${diagnosis}

FARMAKOTERAPIA
${meds.length > 0 ? meds.map(m => `• ${m} - kontynuacja`).join('\n') : 'Bez farmakoterapii'}

ZALECENIA
1. Kontynuacja dotychczasowego leczenia
2. Kontrola za 4 tygodnie
3. W razie pogorszenia - kontakt wcześniejszy`;
};