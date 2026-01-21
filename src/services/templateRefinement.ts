// Mock API service for AI template refinement
// In production, this would call the actual AI backend

export interface RefinementResult {
  refinedPrompt: string;
  humanSummary: string;
  success: boolean;
}

export interface SimulationResult {
  sampleNote: string;
  patientName: string;
  success: boolean;
}

// Simulates the AI refinement process with a delay
export const refineTemplateInstructions = async (
  rawInput: string
): Promise<RefinementResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock refinement logic
  const lowercaseInput = rawInput.toLowerCase();
  
  let refinedPrompt = '';
  let humanSummary = '';

  // Analyze input and generate refined prompt
  if (lowercaseInput.includes('krótk') || lowercaseInput.includes('zwięz')) {
    refinedPrompt += 'Generate concise, bullet-point notes. ';
    humanSummary += 'Zwięzłe notatki w formie punktowej. ';
  } else if (lowercaseInput.includes('szczegół') || lowercaseInput.includes('pełn')) {
    refinedPrompt += 'Generate detailed narrative notes with full documentation. ';
    humanSummary += 'Szczegółowa dokumentacja narracyjna. ';
  } else {
    refinedPrompt += 'Generate standard SOAP-format notes. ';
    humanSummary += 'Standardowy format SOAP. ';
  }

  if (lowercaseInput.includes('lek') || lowercaseInput.includes('farmako')) {
    refinedPrompt += 'Focus on pharmacotherapy and medication changes. ';
    humanSummary += 'Nacisk na farmakoterapię. ';
  }

  if (lowercaseInput.includes('bez historii rodzinnej') || lowercaseInput.includes('pomiń')) {
    refinedPrompt += 'Omit family history section. ';
    humanSummary += 'Pominięcie historii rodzinnej. ';
  }

  if (lowercaseInput.includes('icd') || lowercaseInput.includes('kod')) {
    refinedPrompt += 'Include ICD-10 codes for diagnoses. ';
    humanSummary += 'Uwzględnienie kodów ICD-10. ';
  }

  if (lowercaseInput.includes('zaleceni')) {
    refinedPrompt += 'Emphasize recommendations and follow-up plan. ';
    humanSummary += 'Szczególny nacisk na zalecenia. ';
  }

  // Fallback if no specific instructions detected
  if (!refinedPrompt) {
    refinedPrompt = 'Generate balanced clinical notes based on the consultation. ';
    humanSummary = 'Zbalansowane notatki kliniczne. ';
  }

  return {
    refinedPrompt: refinedPrompt.trim(),
    humanSummary: humanSummary.trim(),
    success: true,
  };
};

// Simulates generating a sample note with the template
export const generateSimulatedNote = async (
  refinedPrompt: string,
  patientData: {
    name: string;
    age: number;
    diagnosis: string;
    meds: string[];
    history: string;
  }
): Promise<SimulationResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { name, age, diagnosis, meds, history } = patientData;
  
  // Determine note style based on refined prompt
  const isConcise = refinedPrompt.toLowerCase().includes('concise');
  const focusMeds = refinedPrompt.toLowerCase().includes('pharmacotherapy');
  const includeICD = refinedPrompt.toLowerCase().includes('icd-10');

  let sampleNote = '';

  if (isConcise) {
    sampleNote = `• Wizyta kontrolna - ${diagnosis}
• ${history.split('.')[0]}
${meds.length > 0 ? `• Leki: ${meds.join(', ')}` : '• Brak stałych leków'}
• Kontrola: 4 tygodnie`;
  } else if (focusMeds) {
    sampleNote = `PACJENT: ${name}, ${age} lat
ROZPOZNANIE: ${diagnosis}${includeICD ? '' : ''}

FARMAKOTERAPIA:
${meds.length > 0 ? meds.map((m) => `• ${m} - kontynuacja`).join('\n') : '• Brak farmakoterapii'}

OCENA: Stan stabilny, tolerancja leków dobra.
PLAN: Kontynuacja leczenia, kontrola za 4 tyg.`;
  } else {
    sampleNote = `DANE PACJENTA
${name}, ${age} lat

WYWIAD
${history}

ROZPOZNANIE
${diagnosis}

LECZENIE
${meds.length > 0 ? meds.map((m) => `• ${m}`).join('\n') : 'Bez farmakoterapii'}

ZALECENIA
1. Kontynuacja dotychczasowego leczenia
2. Kontrola za 4 tygodnie`;
  }

  return {
    sampleNote,
    patientName: name,
    success: true,
  };
};
