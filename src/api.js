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

export async function getInitialData() {
  const students = await apiGet('getStudents');
  const alerts = await apiGet('getAlerts');
  const openLoans = await apiGet('getOpenLoans');
  const materials = await apiGet('getMaterials');

  return {
    ok: true,
    students: students.students || [],
    alerts: alerts.alerts || [],
    openLoans: openLoans.loans || [],
    materials: materials.materials || []
  };
}

export function getStudents() {
  return apiGet('getStudents');
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
