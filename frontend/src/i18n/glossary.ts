/**
 * GLOSSARY — terminologie unificată pe platformă.
 *
 * Reguli:
 *  - „Studenți care pot evalua" pentru contextul de eligibilitate (nu „activi", nu „unici").
 *  - „Scor mediu (1-5)" pentru media Likert. „Notă echivalent (1-10)" doar pentru profesori, opțional.
 *  - „Evaluări transmise" din perspectiva platformă/student. „Evaluări primite" din perspectiva profesor.
 *  - „disciplină" e termenul academic românesc pentru curs/seminar/laborator.
 *  - „Acțiuni CEAC" peste tot (nu „Recomandări"). CEAC = Comisia pentru Evaluarea și Asigurarea Calității.
 *  - „Închiderea buclei" (cu diacritice corecte), evită mixing ro/en.
 */
export const TERMS = {
  // Categorii utilizatori
  studentsEligible: 'Studenți care pot evalua',
  studentsWithRemaining: 'Studenți cu evaluări rămase',
  studentsActive: 'Studenți activi',
  studentsEvaluated: 'Studenți care au evaluat',
  professors: 'Cadre didactice',

  // Scoruri
  scoreAvg: 'Scor mediu (1-5)',
  scoreAvgShort: 'Scor mediu',
  gradeOutOf10: 'Notă echivalent (1-10)',

  // Evaluări — perspective distincte
  evaluationsSent: 'Evaluări transmise',
  evaluationsReceived: 'Evaluări primite',
  evaluationsTotal: 'Total evaluări',
  evaluationsMax: 'Max. evaluări posibile',
  evaluationsDraft: 'Drafturi în curs',

  // Acțiuni CEAC
  ceacActions: 'Acțiuni CEAC',
  ceacProposed: 'Propuse',
  ceacAccepted: 'Acceptate',
  ceacCompleted: 'Finalizate',
  ceacRejected: 'Respinse',

  // Closing-the-loop
  closingLoop: 'Închiderea buclei',
  closingLoopRate: 'Rată închidere buclă',

  // Discipline & activități
  // O DISCIPLINĂ poate avea: curs, seminar, laborator (acestea sunt ACTIVITĂȚI/COMPONENTE).
  // NU sunt „tipuri de curs". Cursul, seminarul, laboratorul sunt forme de activitate didactică.
  discipline: 'disciplină',
  disciplinePlural: 'discipline',
  // Activități (componente) ale unei discipline
  activityCourse: 'curs',
  activitySeminar: 'seminar',
  activityLab: 'laborator',
  activityLabel: 'activitate',
  activitiesPlural: 'activități',
  // Etichetă filtru — în loc de „Tip curs" folosim „Activitate"
  filterActivity: 'Activitate',

  // Participare
  participationUni: 'Universitate',
  participationFac: 'Facultate',
  participationMe: 'Te-au evaluat pe tine',

  // Filtre — labels pentru Select
  filterFaculty: 'Facultate',
  filterProgram: 'Program',
  filterLevel: 'Nivel',
  filterDepartment: 'Departament',
  filterYear: 'Anul',
  filterSemester: 'Semestru',
  filterCourseType: 'Tip curs',
  filterCategory: 'Categorie',
  resetAll: 'Resetează tot',

  // Tabs Acasă
  tabSummary: 'Sumar',
  tabExplore: 'Explorează',
  tabTrend: 'Trend',
} as const;

export type TermKey = keyof typeof TERMS;
