// Small local guideline base used by the retrieval node.
// Production: replace retrieve() with MongoDB Atlas Vector Search over real clinical guidelines.
export const GUIDELINES = [
  { tags: ['chest', 'heart', 'palpitation', 'سینے'], dept: 'Cardiology', source: 'Chest symptoms: exertional chest tightness needs same-day in-person assessment.', weight: 3 },
  { tags: ['fever', 'cough', 'throat', 'flu', 'بخار', 'گلے'], dept: 'General Physician', source: 'Febrile illness: review within 24-48h if fever persists beyond 3 days.', weight: 2 },
  { tags: ['rash', 'itch', 'skin', 'خارش'], dept: 'Dermatology', source: 'Skin rash without fever or swelling is usually routine.', weight: 2 },
  { tags: ['stomach', 'abdominal', 'vomit', 'diarrhea', 'پیٹ'], dept: 'Gastroenterology', source: 'Abdominal pain with vomiting for over 24h needs review for dehydration.', weight: 2 },
  { tags: ['child', 'baby', 'infant', 'بچہ'], dept: 'Pediatrics', source: 'Children under 5 with fever should be reviewed earlier.', weight: 2 },
  { tags: ['headache', 'migraine', 'dizzy', 'سر'], dept: 'Neurology', source: 'New severe headache or neurological change needs urgent review.', weight: 2 },
  { tags: ['bone', 'joint', 'back', 'knee', 'fracture', 'کمر'], dept: 'Orthopedics', source: 'Joint or back pain without trauma or weakness is usually routine.', weight: 1 },
];
export function retrieve(text) {
  const t = text.toLowerCase();
  return GUIDELINES.map((g) => ({ ...g, score: g.tags.filter((k) => t.includes(k)).length * g.weight }))
    .filter((g) => g.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}
