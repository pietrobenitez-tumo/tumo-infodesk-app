const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('Faltan VITE_API_URL o VITE_API_KEY en el archivo .env. El sistema no puede funcionar sin estos valores.');
}

function getToken() {
  return sessionStorage.getItem('tumo_token') || '';
}

async function apiGet(action) {
  const token = encodeURIComponent(getToken());
  const response = await fetch(
    `${API_URL}?action=${action}&key=${encodeURIComponent(API_KEY)}&token=${token}`
  );
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Error en la API');
  }

  return data;
}

async function apiPost(action, payload = {}) {
  const response = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, key: API_KEY, token: getToken() })
  });
  if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Error en la API');
  }

  return data;
}

export function getInitialData() {
  return apiGet('getInitialData');
}

export function getInfodeskData() {
  return apiGet('getInfodeskData');
}

export function getTutors() {
  return apiGet('getTutors');
}

export function getTutorData(data) {
  return apiPost('getTutorData', data);
}

export function getWorkshopLeaders() {
  return apiGet('getWorkshopLeaders');
}

export function getWorkshopLeaderData(data) {
  return apiPost('getWorkshopLeaderData', data);
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

export function saveIncident(data) {
  return apiPost('saveIncident', data);
}

export function saveWorkshopAttendance(data) {
  return apiPost('saveWorkshopAttendance', data);
}

export function saveWorkshopFollowUp(data) {
  return apiPost('saveWorkshopFollowUp', data);
}

export function getAlerts() {
  return apiGet('getAlerts');
}

export function saveAlertManagement(data) {
  return apiPost('saveAlertManagement', data);
}
export function getAttendanceForDate(data) {
  return apiPost('getAttendanceForDate', data);
}

export function getInfodeskTasks() {
  return apiGet('getInfodeskTasks');
}

export function saveInfodeskTask(data) {
  return apiPost('saveInfodeskTask', data);
}

export function updateInfodeskTask(data) {
  return apiPost('updateInfodeskTask', data);
}

export function getInternalCommunicationData(data = {}) {
  return apiPost('getInternalCommunicationData', data);
}

export function saveInternalMessage(data) {
  return apiPost('saveInternalMessage', data);
}

export function updateInternalMessage(data) {
  return apiPost('updateInternalMessage', data);
}

export function saveInternalTask(data) {
  return apiPost('saveInternalTask', data);
}

export function updateInternalTask(data) {
  return apiPost('updateInternalTask', data);
}
