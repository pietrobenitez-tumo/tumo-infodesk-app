const API_URL = 'https://script.google.com/macros/s/AKfycbwnHG4HeRm0tavRPxhX9nYw3zR6m5D5lA7rHXrC_5_AyJ99R47Lds1bJzHwprTZM-0w/exec';

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

export function createIncident(data) {
  return apiPost('createIncident', data);
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
  return apiPost('getInfodeskTasks');
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
