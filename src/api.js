const API_URL = 'https://script.google.com/macros/s/AKfycbxhxiIyPIkxcgDMs6MeqlMgqdIUiBeQlTWSie3FnoUvvhUp_YplcH0f2yMy92354FFq/exec';

async function apiGet(action) {
  const response = await fetch(`${API_URL}?action=${action}`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Error en la API');
  }

  return data;
}

async function apiPost(action, payload = {}) {
  const response = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Error en la API');
  }

  return data;
}

export function getInitialData() {
  return apiGet('getInitialData');
}

export function getStudents() {
  return apiGet('getStudents');
}

export function getTutors() {
  return apiGet('getTutors');
}

export function getTutorData(tutor) {
  return apiPost('getTutorData', { tutor });
}

export function getInfodeskData() {
  return apiGet('getInfodeskData');
}

export function getStudentProfile(idAlumno) {
  return apiPost('getStudentProfile', { idAlumno });
}

export function saveAttendance(data) {
  return apiPost('saveAttendance', data);
}

export function saveComment(data) {
  return apiPost('saveComment', data);
}

export function getMaterials() {
  return apiGet('getMaterials');
}

export function saveMaterial(data) {
  return apiPost('saveMaterial', data);
}

export function createLoan(data) {
  return apiPost('createLoan', data);
}

export function returnLoan(data) {
  return apiPost('returnLoan', data);
}

export function getOpenLoans() {
  return apiGet('getOpenLoans');
}

export function getAlerts() {
  return apiGet('getAlerts');
}

export function createIncident(data) {
  return apiPost('createIncident', data);
}

export function saveIncident(data) {
  return apiPost('saveIncident', data);
}
