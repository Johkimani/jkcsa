export const CATEGORY_ORDER = [
  'Executive', 'Jumuiya Coordinators', 'Bible Coordinators', 'Rosary', 'Pamphlet Managers', 'Project Managers', 'Liturgist', 'Choir Officials', 'Instrument Managers', 'Liturgical Dancers', 'Catechist'
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-green-600 to-green-700',
  'Rosary': 'from-pink-600 to-pink-700',
  'Pamphlet Managers': 'from-orange-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgist': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-blue-600 to-blue-700',
  'Liturgical Dancers': 'from-blue-600 to-blue-700',
  'Catechist': 'from-yellow-600 to-yellow-700'
};

export const POSITION_BY_CATEGORY: Record<string, string[]> = {
  'Executive': ['Chairperson', 'Vice Chairperson', 'Organizing Secretary', 'Treasurer', 'Secretary', 'Assistant Secretary'],
  'Jumuiya Coordinators': ['Jumuiya Coordinator', 'Assistant Jumuiya Coordinator'],
  'Bible Coordinators': ['Bible Study Coordinator', 'Assistant Bible Study Coordinator'],
  'Rosary': ['Rosary Coordinator', 'Assistant Rosary Coordinator'],
  'Pamphlet Managers': ['Pamphlet Manager', 'Assistant Pamphlet Manager'],
  'Project Managers': ['Project Manager', 'Assistant Project Manager'],
  'Liturgist': ['Liturgist', 'Assistant Liturgist'],
  'Choir Officials': ['Choir Chairperson', 'Choir Vice Chairperson'],
  'Instrument Managers': ['Instrument Manager', 'Assistant Instrument Manager'],
  'Liturgical Dancers': ['Dance Coordinator', 'Assistant Dance Coordinator'],
  'Catechist': ['Catechist']
};

export const POSITION_RANK: Record<string, number> = {};
Object.values(POSITION_BY_CATEGORY).forEach((positions, catIdx) => {
  positions.forEach((pos, idx) => {
    POSITION_RANK[pos] = catIdx * 100 + idx;
  });
});

export const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E';
