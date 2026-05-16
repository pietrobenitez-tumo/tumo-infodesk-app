import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getInitialData,
  getInfodeskData,
  getTutorData,
  getWorkshopLeaderData,
  getStudentProfile,
  createLoan,
  returnLoan,
  saveIncident,
  saveAttendance,
  saveComment,
  saveWorkshopAttendance,
  saveWorkshopFollowUp,
  saveAlertManagement,
  getAttendanceForDate,
  getInfodeskTasks,
  saveInfodeskTask,
  updateInfodeskTask,
  getInternalCommunicationData,
  saveInternalMessage,
  updateInternalMessage,
  saveInternalTask,
  updateInternalTask
} from './api';
import './styles.css';

export default function App() {
  const [googleToken, setGoogleToken] = useState(() => {
    const token = sessionStorage.getItem('tumo_token');
    const expiry = sessionStorage.getItem('tumo_token_expiry');
    if (token && expiry && Date.now() < Number(expiry)) return token;
    return null;
  });
  const [loggedUser, setLoggedUser] = useState(
    () => sessionStorage.getItem('tumo_user') || ''
  );

  const [view, setView] = useState('home');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [initialData, setInitialData] = useState({});
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [infodeskPeople, setInfodeskPeople] = useState([]);
  const [selectedInfodesk, setSelectedInfodesk] = useState('');
  const [materials, setMaterials] = useState([]);
  const [openLoans, setOpenLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [infodeskTasks, setInfodeskTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('Media');
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [showLoanHistory, setShowLoanHistory] = useState(false);

  const [infodeskSearch, setInfodeskSearch] = useState('');
  const [infodeskStudent, setInfodeskStudent] = useState(null);
  const [infodeskProfile, setInfodeskProfile] = useState(null);

  const [quickLoanSearch, setQuickLoanSearch] = useState('');
  const [quickLoanStudent, setQuickLoanStudent] = useState(null);
  const [quickLoanMaterialId, setQuickLoanMaterialId] = useState('');
  const [incidentText, setIncidentText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [lateTime, setLateTime] = useState(currentTime());

  const [selectedTutor, setSelectedTutor] = useState(null);
  const [tutorStudents, setTutorStudents] = useState([]);
  const [tutorGroups, setTutorGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [attendanceRows, setAttendanceRows] = useState({});
  const [commentOpenRows, setCommentOpenRows] = useState({});

  const [selectedLeader, setSelectedLeader] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopRows, setWorkshopRows] = useState({});

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profile, setProfile] = useState(null);

  const [internalUsers, setInternalUsers] = useState([]);
  const [selectedInternalUser, setSelectedInternalUser] = useState(null);
  const [internalMessages, setInternalMessages] = useState([]);
  const [internalTasks, setInternalTasks] = useState([]);
  const [messageDestinationId, setMessageDestinationId] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [taskDestinationId, setTaskDestinationId] = useState('');
  const [internalTaskTitle, setInternalTaskTitle] = useState('');
  const [internalTaskDescription, setInternalTaskDescription] = useState('');
  const [internalTaskPriority, setInternalTaskPriority] = useState('Media');
  const [showInternalCommunication, setShowInternalCommunication] = useState(false);
  const [showInfodeskTaskForm, setShowInfodeskTaskForm] = useState(false);

  useEffect(() => {
    if (googleToken) loadInitial();
  }, [googleToken]);
  useEffect(() => {
  if (!selectedTutor) return;
  if (!selectedGroup) return;
  if (!attendanceDate) return;
  if (!tutorStudents.length) return;

  loadAttendanceForSelectedDate(selectedGroup, attendanceDate);
}, [selectedTutor, selectedGroup, attendanceDate, tutorStudents.length]);

  function handleGoogleCredential(response) {
    try {
      const token = response.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      sessionStorage.setItem('tumo_token', token);
      sessionStorage.setItem('tumo_token_expiry', String(payload.exp * 1000));
      sessionStorage.setItem('tumo_user', payload.email);
      setLoggedUser(payload.email);
      setGoogleToken(token);
    } catch {
      console.error('Error al procesar el token de Google.');
    }
  }

  function handleLogout() {
    try {
      const token = sessionStorage.getItem('tumo_token');
      if (token && window.google) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        window.google.accounts.id.revoke(payload.email, () => {});
      }
    } catch {}
    sessionStorage.removeItem('tumo_token');
    sessionStorage.removeItem('tumo_token_expiry');
    sessionStorage.removeItem('tumo_user');
    setGoogleToken(null);
    setLoggedUser('');
    setView('home');
  }

  async function loadInitial() {
    try {
      setLoading(true);
      const data = await getInitialData();
      setInitialData(data);
      setInfodeskPeople(data.infodeskPeople || []);
      setAlerts(data.alerts || []);
      setInternalUsers(data.internalUsers || []);
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshInitialWithoutLoading() {
    try {
      const data = await getInitialData();
      setInitialData(data);
      setInfodeskPeople(data.infodeskPeople || []);
      setAlerts(data.alerts || []);
      setInternalUsers(data.internalUsers || []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openInfodesk(personName) {
    try {
      setSelectedInfodesk(personName);
      setView('infodesk');

      const data = await getInfodeskData();
      setStudents(data.students || []);
      setMaterials(data.materials || []);
      setOpenLoans(data.openLoans || []);
      setAllLoans(data.allLoans || []);
      setIncidents(data.incidents || []);
      setInfodeskTasks(data.tasks || []);

      setInfodeskSearch('');
      setInfodeskStudent(null);
      setInfodeskProfile(null);
      setCommentText('');
      setIncidentText('');
      setQuickLoanSearch('');
      setQuickLoanStudent(null);
      setQuickLoanMaterialId('');
      setLateTime(currentTime());
      setShowInternalCommunication(false);
      setShowInfodeskTaskForm(false);

      const internalUser = findInternalUser('Infodesk', ['Infodesk']) || internalUsers.find(user => String(user.ID_USUARIO) === 'INFODESK') || null;
      await loadInternalCommunicationForUser(internalUser);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function refreshInfodesk() {
    try {
      const data = await getInfodeskData();
      setStudents(data.students || []);
      setMaterials(data.materials || []);
      setOpenLoans(data.openLoans || []);
      setAllLoans(data.allLoans || []);
      setIncidents(data.incidents || []);
      setInfodeskTasks(data.tasks || []);
      setStatus('Infodesk actualizado.');
    } catch (error) {
      setStatus(error.message);
    }
  }


  async function createInfodeskTask() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!taskTitle.trim()) throw new Error('Escribí el título de la tarea.');

      const res = await saveInfodeskTask({
        titulo: taskTitle,
        descripcion: taskDescription,
        prioridad: taskPriority,
        estado: 'Pendiente',
        personaInfodesk: selectedInfodesk
      });

      setStatus(res.message || 'Tarea creada.');
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('Media');
      setShowInfodeskTaskForm(false);
      await refreshInfodesk();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function editInfodeskTask(task) {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!task.ID_TAREA) throw new Error('Esta tarea no tiene ID. Revisá la hoja TAREAS_INFODESK.');

      const titulo = prompt('Título de la tarea:', task.Titulo || '') ?? (task.Titulo || '');
      if (!titulo.trim()) return;

      const descripcion = prompt('Descripción:', task.Descripcion || '') ?? (task.Descripcion || '');
      const comentarios = prompt('Comentarios:', task.Comentarios || '') ?? (task.Comentarios || '');

      const estado = prompt(
        'Estado: Pendiente, En proceso o Resuelto',
        task.Estado || 'Pendiente'
      ) || task.Estado || 'Pendiente';

      const prioridad = prompt(
        'Prioridad: Baja, Media, Alta o Urgente',
        task.Prioridad || 'Media'
      ) || task.Prioridad || 'Media';

      const res = await updateInfodeskTask({
        idTarea: task.ID_TAREA,
        titulo,
        descripcion,
        comentarios,
        estado,
        prioridad,
        personaInfodesk: selectedInfodesk,
        resueltoPor: estado === 'Resuelto' ? selectedInfodesk : ''
      });

      setStatus(res.message || 'Tarea actualizada.');
      await refreshInfodesk();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function resolveInfodeskTask(task) {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!task.ID_TAREA) throw new Error('Esta tarea no tiene ID. Revisá la hoja TAREAS_INFODESK.');

      const comentarios = prompt('Comentario de resolución:', task.Comentarios || '') ?? (task.Comentarios || '');

      const res = await updateInfodeskTask({
        idTarea: task.ID_TAREA,
        titulo: task.Titulo || '',
        descripcion: task.Descripcion || '',
        comentarios,
        estado: 'Resuelto',
        prioridad: task.Prioridad || 'Media',
        personaInfodesk: selectedInfodesk,
        resueltoPor: selectedInfodesk
      });

      setStatus(res.message || 'Tarea resuelta.');
      await refreshInfodesk();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function selectInfodeskStudent(student) {
    try {
      setInfodeskStudent(student);
      const data = await getStudentProfile(student.ID_ALUMNO);
      setInfodeskProfile(data);
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function saveInfodeskComment() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!infodeskStudent) throw new Error('Seleccioná un alumno.');
      if (!commentText.trim()) throw new Error('Escribí un comentario.');

      const res = await saveComment({
        idAlumno: infodeskStudent.ID_ALUMNO,
        tipo: 'Infodesk',
        comentario: commentText,
        proximaAccion: '',
        registradoPor: selectedInfodesk,
        estado: 'Pendiente'
      });

      setStatus(res.message || 'Comentario guardado.');
      setCommentText('');
      await selectInfodeskStudent(infodeskStudent);
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function registerLateArrival() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!infodeskStudent) throw new Error('Seleccioná un alumno.');
      if (!lateTime) throw new Error('Indicá la hora de llegada.');

      const res = await saveAttendance({
        fecha: today(),
        grupo: infodeskStudent.Grupo_App || '',
        registradoPor: selectedInfodesk,
        registros: [
          {
            idAlumno: infodeskStudent.ID_ALUMNO,
            estado: 'Tarde',
            horaLlegada: lateTime,
            comentario: `Llegada tarde registrada desde Infodesk a las ${lateTime}`
          }
        ]
      });

      setStatus(res.message || 'Llegada tarde registrada.');
      await selectInfodeskStudent(infodeskStudent);
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function createQuickLoan() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!quickLoanStudent) throw new Error('Seleccioná un alumno para el préstamo.');
      if (!quickLoanMaterialId) throw new Error('Seleccioná un material con ID_MATERIAL válido. Revisá que ese mouse o auricular tenga ID en la hoja MATERIALES.');

      const material = materials.find(m => String(m.ID_MATERIAL) === String(quickLoanMaterialId));
      const materialLabel = formatMaterialDisplay(material);

      const res = await createLoan({
        idAlumno: quickLoanStudent.ID_ALUMNO,
        idMaterial: quickLoanMaterialId,
        material: materialLabel,
        personaInfodesk: selectedInfodesk
      });

      setStatus(res.message || 'Préstamo registrado.');
      setQuickLoanSearch('');
      setQuickLoanStudent(null);
      setQuickLoanMaterialId('');

      await refreshInfodesk();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function closeLoan(loan, estadoPrestamo = 'Devuelto', estadoMaterial = 'Disponible') {
    const previousOpenLoans = openLoans;
    const previousAllLoans = allLoans;

    try {
      setOpenLoans(prev => prev.filter(item => String(item.ID_PRESTAMO) !== String(loan.ID_PRESTAMO)));
      setAllLoans(prev => prev.map(item => {
        if (String(item.ID_PRESTAMO) !== String(loan.ID_PRESTAMO)) return item;

        return {
          ...item,
          Estado: estadoPrestamo,
          Fecha_Devolucion: today(),
          Recibido_Por: selectedInfodesk
        };
      }));

      setStatus(
        estadoPrestamo === 'Dañado'
          ? 'Material marcado como dañado. Guardando...'
          : 'Devolución registrada visualmente. Guardando...'
      );

      const res = await returnLoan({
        idPrestamo: loan.ID_PRESTAMO,
        idMaterial: loan.ID_MATERIAL,
        estadoPrestamo,
        estadoMaterial,
        personaInfodesk: selectedInfodesk
      });

      setStatus(res.message || 'Devolución registrada.');
      await refreshInitialWithoutLoading();
    } catch (error) {
      setOpenLoans(previousOpenLoans);
      setAllLoans(previousAllLoans);
      setStatus(`No se pudo guardar la devolución: ${error.message}`);
    }
  }

  async function createNewIncident() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!infodeskStudent) throw new Error('Seleccioná un alumno.');
      if (!incidentText.trim()) throw new Error('Escribí la incidencia.');

      const res = await saveIncident({
        idAlumno: infodeskStudent.ID_ALUMNO,
        descripcion: incidentText,
        tipo: 'Infodesk',
        estado: 'Abierta',
        personaInfodesk: selectedInfodesk,
        derivadoA: ''
      });

      setStatus(res.message || 'Incidencia registrada.');
      setIncidentText('');
      await refreshInfodesk();
      await selectInfodeskStudent(infodeskStudent);
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openTutor(tutor) {
    try {
      setSelectedTutor(tutor);
      setView('tutor');
      setSelectedGroup('');
      setAttendanceRows({});
      setCommentOpenRows({});
      setProfile(null);
      setSelectedStudent(null);
      setShowInternalCommunication(false);

      const data = await getTutorData({
        tutorId: tutor.ID_TUTOR,
        tutor: tutor.Nombre
      });

      setTutorStudents(data.students || []);
      setTutorGroups(data.groups || []);

      const internalUser = findInternalUser(tutor.Nombre, ['Tutor']);
      await loadInternalCommunicationForUser(internalUser);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function refreshTutorData(tutor = selectedTutor) {
    try {
      if (!tutor) return;

      const data = await getTutorData({
        tutorId: tutor.ID_TUTOR,
        tutor: tutor.Nombre
      });

      setTutorStudents(data.students || []);
      setTutorGroups(data.groups || []);
    } catch (error) {
      setStatus(error.message);
    }
  }

 async function loadAttendanceForSelectedDate(group = selectedGroup, date = attendanceDate) {
  try {
    if (!group || !date) return;

    const currentGroupStudents = tutorStudents.filter(s => s.Grupo_App === group);
    const idAlumnos = currentGroupStudents.map(s => s.ID_ALUMNO);

    if (idAlumnos.length === 0) return;

    const data = await getAttendanceForDate({
      grupo: group,
      fecha: date,
      idAlumnos
    });

    const rows = {};

    Object.keys(data.records || {}).forEach(idAlumno => {
      const record = data.records[idAlumno];
      const estado = record.Estado || record.Estado_Asistencia || '';

      rows[String(idAlumno)] = {
        estado,
        horaLlegada: record.Hora_Llegada || (estado === 'Tarde' ? currentTime() : ''),
        comentario: record.Comentario || ''
      };
    });

    setAttendanceRows(rows);
  } catch (error) {
    setStatus(error.message);
  }
}
  function setAttendance(idAlumno, estado) {
    const key = String(idAlumno);

    setAttendanceRows(prev => {
      const current = prev[key] || {};
      const nextEstado = current.estado === estado ? '' : estado;

      return {
        ...prev,
        [key]: {
          ...current,
          estado: nextEstado,
          horaLlegada: nextEstado === 'Tarde' ? (current.horaLlegada || currentTime()) : ''
        }
      };
    });
  }

  function setAttendanceComment(idAlumno, comentario) {
    const key = String(idAlumno);

    setAttendanceRows(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        comentario
      }
    }));
  }

  function toggleAttendanceComment(idAlumno) {
    const key = String(idAlumno);

    setCommentOpenRows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  function setAttendanceLateTime(idAlumno, horaLlegada) {
    const key = String(idAlumno);

    setAttendanceRows(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        horaLlegada
      }
    }));
  }

  async function saveGroupAttendance() {
    try {
      if (!selectedTutor) throw new Error('Seleccioná un tutor.');
      if (!selectedGroup) throw new Error('Seleccioná un grupo.');

      const groupStudents = tutorStudents.filter(s => s.Grupo_App === selectedGroup);

      const registros = groupStudents
        .map(s => {
          const row = attendanceRows[String(s.ID_ALUMNO)] || {};

          return {
            idAlumno: s.ID_ALUMNO,
            estado: row.estado || '',
            horaLlegada: row.horaLlegada || '',
            comentario: row.comentario || ''
          };
        })
        .filter(r => String(r.estado || '').trim());

      if (registros.length === 0) {
        throw new Error('No marcaste ninguna asistencia para guardar.');
      }
      const res = await saveAttendance({
        fecha: attendanceDate,
        grupo: selectedGroup,
        registradoPor: selectedTutor.Nombre,
        registros
      });

      setStatus(
        `${res.message || 'Lista guardada.'} Creados: ${res.created || 0}. Actualizados: ${res.updated || 0}.`
      );

      await refreshTutorData();
      await loadAttendanceForSelectedDate(selectedGroup, attendanceDate);
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openStudentProfile(student) {
    try {
      setSelectedStudent(student);
      const data = await getStudentProfile(student.ID_ALUMNO);
      setProfile(data);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function addCommentToStudent() {
    try {
      if (!selectedStudent) throw new Error('Seleccioná un alumno.');

      const comentario = prompt('Comentario de seguimiento:');
      if (!comentario) return;

      const res = await saveComment({
        idAlumno: selectedStudent.ID_ALUMNO,
        comentario,
        tipo: 'General',
        registradoPor: selectedTutor?.Nombre || selectedInfodesk || selectedLeader?.Nombre || ''
      });

      setStatus(res.message || 'Comentario guardado.');
      await openStudentProfile(selectedStudent);
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function createTaskForInfodeskFromTutor(student = null) {
  try {
    if (!selectedTutor) throw new Error('Seleccioná un tutor.');

    const titulo = prompt('Título de la tarea para Infodesk:');
    if (!titulo || !titulo.trim()) return;

    const descripcion = prompt('Descripción para Infodesk:') || '';

    const prioridad = prompt(
      'Prioridad: Baja, Media, Alta o Urgente',
      'Media'
    ) || 'Media';

    const studentText = student
      ? `\n\nAlumno vinculado: ${student.Nombre_Completo || ''} · ${student.Grupo_App || ''} · ${student.Usuario || ''}`
      : '';

    const res = await saveInfodeskTask({
      titulo,
      descripcion: `${descripcion}${studentText}`,
      prioridad,
      estado: 'Pendiente',
      personaInfodesk: selectedTutor.Nombre
    });

    setStatus(res.message || 'Tarea enviada a Infodesk.');
    await refreshInitialWithoutLoading();
  } catch (error) {
    setStatus(error.message);
  }
}

  async function manageAlert(alert, estadoGestion) {
    try {
      const nota = prompt(`Nota para marcar como ${estadoGestion}:`) || '';

      const res = await saveAlertManagement({
        idAlerta: alert.ID_ALERTA,
        fecha: alert.Fecha,
        idAlumno: alert.ID_ALUMNO,
        alumno: alert.Alumno,
        grupoApp: alert.Grupo_App,
        tutorTumo: alert.Tutor_TUMO,
        tipo: alert.Tipo,
        motivo: alert.Motivo,
        estadoGestion,
        gestionadoPor: selectedTutor?.Nombre || '',
        nota
      });

      setStatus(res.message || 'Gestión de alerta guardada.');
      await refreshInitialWithoutLoading();
      await refreshTutorData();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openWorkshopLeader(leader) {
    try {
      setSelectedLeader(leader);
      setSelectedWorkshop(null);
      setWorkshopRows({});
      setProfile(null);
      setShowInternalCommunication(false);
      setView('workshop');

      const data = await getWorkshopLeaderData({
        leaderId: leader.ID_LIDER,
        leader: leader.Nombre
      });

      setWorkshops(data.workshops || []);

      const internalUser = findInternalUser(leader.Nombre, ['Tallerista']);
      await loadInternalCommunicationForUser(internalUser);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function setWorkshopAttendance(idAlumno, field, value) {
    setWorkshopRows(prev => ({
      ...prev,
      [idAlumno]: {
        ...(prev[idAlumno] || {}),
        [field]: value
      }
    }));
  }

  async function saveCurrentWorkshopAttendance() {
    try {
      if (!selectedLeader) throw new Error('Seleccioná un líder.');
      if (!selectedWorkshop) throw new Error('Seleccioná un taller.');

      const registros = (selectedWorkshop.participants || []).map(p => ({
        idAlumno: p.ID_ALUMNO,
        estado: workshopRows[p.ID_ALUMNO]?.estado || 'Presente',
        participacion: workshopRows[p.ID_ALUMNO]?.participacion || '',
        comentario: workshopRows[p.ID_ALUMNO]?.comentario || ''
      }));

      const res = await saveWorkshopAttendance({
        idTaller: selectedWorkshop.ID_TALLER,
        registradoPor: selectedLeader.Nombre,
        registros
      });

      setStatus(res.message || 'Lista de taller guardada.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function saveWorkshopStudentFollowUp(participant) {
    try {
      const row = workshopRows[participant.ID_ALUMNO] || {};

      const res = await saveWorkshopFollowUp({
        idTaller: selectedWorkshop.ID_TALLER,
        idAlumno: participant.ID_ALUMNO,
        participacion: row.participacion || '',
        avanceProyecto: row.avanceProyecto || '',
        dificultades: row.dificultades || '',
        observacion: row.comentario || '',
        requiereAccion: row.requiereAccion || 'Solo registro',
        registradoPor: selectedLeader.Nombre
      });

      setStatus(res.message || 'Seguimiento de taller guardado.');
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }


  function findInternalUser(nombre, roles = []) {
    const targetName = normalize(nombre);
    const normalizedRoles = roles.map(role => normalize(role));

    return internalUsers.find(user => {
      const userName = normalize(user.Nombre);
      const sameName =
        userName === targetName ||
        userName.includes(targetName) ||
        targetName.includes(userName);

      const roleText = normalize(user.Rol);
      const sameRole =
        normalizedRoles.length === 0 ||
        normalizedRoles.some(role =>
          roleText === role ||
          roleText.includes(role) ||
          role.includes(roleText)
        );

      return sameName && sameRole;
    }) || null;
  }

  async function loadInternalCommunicationForUser(user, options = {}) {
    try {
      if (!user) {
        setSelectedInternalUser(null);
        setInternalMessages([]);
        setInternalTasks([]);
        return;
      }

      setSelectedInternalUser(user);

      const data = await getInternalCommunicationData(
        options.loadAll ? {} : { userId: user.ID_USUARIO }
      );

      setInternalUsers(data.users || []);
      setInternalMessages(data.messages || []);
      setInternalTasks(data.tasks || []);

      setMessageDestinationId('');
      setMessageSubject('');
      setMessageBody('');
      setTaskDestinationId('');
      setInternalTaskTitle('');
      setInternalTaskDescription('');
      setInternalTaskPriority('Media');

      if (!options.keepStatus) setStatus('');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function refreshInternalCommunication(user = selectedInternalUser) {
    try {
      if (!user) return;

      const isTeamLeadView = view === 'teamLead';

      const data = await getInternalCommunicationData(
        isTeamLeadView ? {} : { userId: user.ID_USUARIO }
      );

      setInternalUsers(data.users || []);
      setInternalMessages(data.messages || []);
      setInternalTasks(data.tasks || []);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openTeamLead(user) {
    setShowInternalCommunication(false);
    setView('teamLead');
    await loadInternalCommunicationForUser(user, { loadAll: true });
  }

  async function createInternalMessage() {
    try {
      if (!selectedInternalUser) throw new Error('Seleccioná un usuario.');
      if (!messageDestinationId) throw new Error('Seleccioná un destinatario.');
      if (!messageSubject.trim() && !messageBody.trim()) throw new Error('Escribí asunto o mensaje.');

      const res = await saveInternalMessage({
        origenId: selectedInternalUser.ID_USUARIO,
        destinoId: messageDestinationId,
        asunto: messageSubject,
        mensaje: messageBody
      });

      setStatus(res.message || 'Mensaje enviado.');
      setMessageDestinationId('');
      setMessageSubject('');
      setMessageBody('');
      await refreshInternalCommunication();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function respondInternalMessage(message) {
    try {
      if (!selectedInternalUser) throw new Error('Seleccioná un usuario.');

      const respuesta = prompt('Respuesta al mensaje:', message.Respuesta || '');
      if (respuesta === null) return;

      const res = await updateInternalMessage({
        idMensaje: message.ID_MENSAJE,
        estado: respuesta.trim() ? 'Respondido' : 'Pendiente',
        respuesta,
        respondidoPor: selectedInternalUser.Nombre
      });

      setStatus(res.message || 'Mensaje actualizado.');
      await refreshInternalCommunication();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function archiveInternalMessage(message) {
    try {
      const res = await updateInternalMessage({
        idMensaje: message.ID_MENSAJE,
        estado: 'Archivado',
        respuesta: message.Respuesta || '',
        respondidoPor: selectedInternalUser?.Nombre || ''
      });

      setStatus(res.message || 'Mensaje archivado.');
      await refreshInternalCommunication();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function createInternalTask() {
    try {
      if (!selectedInternalUser) throw new Error('Seleccioná un usuario.');
      if (!taskDestinationId) throw new Error('Seleccioná un destinatario.');
      if (!internalTaskTitle.trim()) throw new Error('Escribí el título de la tarea.');

      const res = await saveInternalTask({
        creadoPorId: selectedInternalUser.ID_USUARIO,
        destinoId: taskDestinationId,
        titulo: internalTaskTitle,
        descripcion: internalTaskDescription,
        prioridad: internalTaskPriority,
        estado: 'Pendiente'
      });

      setStatus(res.message || 'Tarea creada.');
      setTaskDestinationId('');
      setInternalTaskTitle('');
      setInternalTaskDescription('');
      setInternalTaskPriority('Media');
      await refreshInternalCommunication();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function editInternalTask(task) {
    try {
      if (!selectedInternalUser) throw new Error('Seleccioná un usuario.');

      const titulo = prompt('Título de la tarea:', task.Titulo || '') ?? (task.Titulo || '');
      if (!titulo.trim()) return;

      const descripcion = prompt('Descripción:', task.Descripcion || '') ?? (task.Descripcion || '');
      const comentarios = prompt('Comentarios:', task.Comentarios || '') ?? (task.Comentarios || '');

      const estado = prompt(
        'Estado: Pendiente, En proceso o Resuelto',
        task.Estado || 'Pendiente'
      ) || task.Estado || 'Pendiente';

      const prioridad = prompt(
        'Prioridad: Baja, Media, Alta o Urgente',
        task.Prioridad || 'Media'
      ) || task.Prioridad || 'Media';

      const res = await updateInternalTask({
        idTarea: task.ID_TAREA,
        titulo,
        descripcion,
        comentarios,
        estado,
        prioridad,
        resueltoPor: normalizeStatus(estado) === 'resuelto' ? selectedInternalUser.Nombre : ''
      });

      setStatus(res.message || 'Tarea actualizada.');
      await refreshInternalCommunication();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function resolveInternalTask(task) {
    try {
      const comentarios = prompt('Comentario de resolución:', task.Comentarios || '') ?? (task.Comentarios || '');

      const res = await updateInternalTask({
        idTarea: task.ID_TAREA,
        titulo: task.Titulo || '',
        descripcion: task.Descripcion || '',
        prioridad: task.Prioridad || 'Media',
        estado: 'Resuelto',
        comentarios,
        resueltoPor: selectedInternalUser?.Nombre || ''
      });

      setStatus(res.message || 'Tarea resuelta.');
      await refreshInternalCommunication();
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }


  function renderInternalCommunicationPanel({ showAll = false } = {}) {
    const currentUserId = String(selectedInternalUser?.ID_USUARIO || '');
    const selectableInternalUsers = internalUsers.filter((user, index, arr) => {
      const id = String(user.ID_USUARIO || '');
      if (!id) return false;

      return arr.findIndex(other => String(other.ID_USUARIO || '') === id) === index;
    });

    const receivedMessages = internalMessages.filter(message => {
      const visible = normalizeStatus(message.Estado) !== 'archivado';
      if (!visible) return false;
      return showAll || String(message.Destino_ID) === currentUserId;
    });

    const pendingReceivedMessages = receivedMessages.filter(message =>
      normalizeStatus(message.Estado) === 'pendiente'
    );

    const pendingReceivedCount = pendingReceivedMessages.length;

    const sentMessages = internalMessages.filter(message => {
      return showAll || String(message.Origen_ID) === currentUserId;
    });

    const receivedTasks = internalTasks.filter(task => {
      const pending = normalizeStatus(task.Estado) !== 'resuelto';
      if (!pending) return false;
      return showAll || String(task.Destino_ID) === currentUserId;
    });

    const sentTasks = internalTasks.filter(task => {
      return showAll || String(task.Creado_Por_ID) === currentUserId;
    });

    if (!selectedInternalUser) {
      return (
        <section className="subsection">
          <h3>Comunicación interna</h3>
          <p>No se encontró este perfil en USUARIOS_INTERNOS.</p>
        </section>
      );
    }

    if (!showInternalCommunication) {
      return (
        <button
          className={`btn secondary internal-communication-toggle ${pendingReceivedCount > 0 ? 'has-pending-messages' : ''}`}
          onClick={() => setShowInternalCommunication(true)}
        >
          <span>Comunicación interna</span>

          {pendingReceivedCount > 0 && (
            <span className="message-badge">
              {pendingReceivedCount}
            </span>
          )}
        </button>
      );
    }

    return (
      <section className={`subsection internal-communication ${pendingReceivedCount > 0 ? 'has-pending-messages' : ''}`}>
        <div className="internal-title-row">
          <h3>Comunicación interna</h3>

          <div className="internal-title-actions">
            {pendingReceivedCount > 0 && (
              <span className="message-badge">
                {pendingReceivedCount}
              </span>
            )}

            <button className="tiny-btn" onClick={() => setShowInternalCommunication(false)}>
              Cerrar
            </button>
          </div>
        </div>

        <p>
          <strong>Perfil:</strong> {selectedInternalUser.Nombre} · {selectedInternalUser.Rol}
        </p>

        <details>
          <summary>Enviar mensaje</summary>

          <label>Destinatario</label>
          <select value={messageDestinationId} onChange={e => setMessageDestinationId(e.target.value)}>
            <option value="">Seleccionar destinatario</option>
            {selectableInternalUsers
              .filter(user => String(user.ID_USUARIO) !== currentUserId)
              .map(user => (
                <option key={user.ID_USUARIO} value={user.ID_USUARIO}>
                  {user.Nombre} · {user.Rol}
                </option>
              ))}
          </select>

          <label>Asunto</label>
          <input
            value={messageSubject}
            onChange={e => setMessageSubject(e.target.value)}
            placeholder="Asunto del mensaje..."
          />

          <label>Mensaje</label>
          <textarea
            value={messageBody}
            onChange={e => setMessageBody(e.target.value)}
            placeholder="Escribí el mensaje..."
          />

          <button className="btn success" onClick={createInternalMessage}>
            Enviar mensaje
          </button>
        </details>

        <details>
          <summary>Crear tarea</summary>

          <label>Destinatario</label>
          <select value={taskDestinationId} onChange={e => setTaskDestinationId(e.target.value)}>
            <option value="">Seleccionar destinatario</option>
            {selectableInternalUsers
              .filter(user => String(user.ID_USUARIO) !== currentUserId)
              .map(user => (
                <option key={user.ID_USUARIO} value={user.ID_USUARIO}>
                  {user.Nombre} · {user.Rol}
                </option>
              ))}
          </select>

          <label>Título</label>
          <input
            value={internalTaskTitle}
            onChange={e => setInternalTaskTitle(e.target.value)}
            placeholder="Título de la tarea..."
          />

          <label>Descripción</label>
          <textarea
            value={internalTaskDescription}
            onChange={e => setInternalTaskDescription(e.target.value)}
            placeholder="Detalle de la tarea..."
          />

          <label>Prioridad</label>
          <select value={internalTaskPriority} onChange={e => setInternalTaskPriority(e.target.value)}>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
            <option>Urgente</option>
          </select>

          <button className="btn success" onClick={createInternalTask}>
            Crear tarea
          </button>
        </details>

        <details>
          <summary>
            <span>{showAll ? 'Mensajes del equipo' : 'Mensajes recibidos'}</span>

            {pendingReceivedCount > 0 && (
              <span className="summary-badge">
                {pendingReceivedCount} pendiente{pendingReceivedCount > 1 ? 's' : ''}
              </span>
            )}
          </summary>

          {receivedMessages.length === 0 && <p>No hay mensajes recibidos.</p>}

          {receivedMessages.map(message => (
            <div className="list-item" key={message.ID_MENSAJE}>
              <strong>{message.Asunto || 'Sin asunto'}</strong>
              <span>De: {message.Origen_Nombre} · {message.Origen_Rol}</span>
              {showAll && <span>Para: {message.Destino_Nombre} · {message.Destino_Rol}</span>}
              <span>{message.Mensaje}</span>
              <span>Estado: {message.Estado || 'Pendiente'} · {message.Fecha}</span>
              {message.Respuesta && <span>Respuesta: {message.Respuesta}</span>}

              <div className="task-actions">
                <button className="btn secondary" onClick={() => respondInternalMessage(message)}>
                  Responder
                </button>
                <button className="btn light" onClick={() => archiveInternalMessage(message)}>
                  Archivar
                </button>
              </div>
            </div>
          ))}
        </details>

        <details>
          <summary>{showAll ? 'Tareas del equipo' : 'Tareas recibidas'}</summary>

          {receivedTasks.length === 0 && <p>No hay tareas pendientes.</p>}

          {receivedTasks.map(task => (
            <div className="task-card" key={task.ID_TAREA}>
              <strong>{task.Titulo}</strong>
              {task.Descripcion && <span>{task.Descripcion}</span>}
              <span>De: {task.Creado_Por_Nombre} · {task.Creado_Por_Rol}</span>
              {showAll && <span>Para: {task.Destino_Nombre} · {task.Destino_Rol}</span>}
              <span>Estado: {task.Estado} · Prioridad: {task.Prioridad}</span>
              {task.Comentarios && <span>Comentarios: {task.Comentarios}</span>}

              <div className="task-actions">
                <button className="btn secondary" onClick={() => editInternalTask(task)}>
                  Editar
                </button>
                <button className="btn success" onClick={() => resolveInternalTask(task)}>
                  Marcar resuelta
                </button>
              </div>
            </div>
          ))}
        </details>

        <details>
          <summary>{showAll ? 'Mensajes enviados del equipo' : 'Mensajes enviados'}</summary>

          {sentMessages.length === 0 && <p>No hay mensajes enviados.</p>}

          {sentMessages.slice(0, 20).map(message => (
            <div className="list-item" key={message.ID_MENSAJE}>
              <strong>{message.Asunto || 'Sin asunto'}</strong>
              <span>De: {message.Origen_Nombre} · {message.Origen_Rol}</span>
              <span>Para: {message.Destino_Nombre} · {message.Destino_Rol}</span>
              <span>{message.Mensaje}</span>
              <span>Estado: {message.Estado || 'Pendiente'} · {message.Fecha}</span>
              {message.Respuesta && <span>Respuesta: {message.Respuesta}</span>}
            </div>
          ))}
        </details>

        <details>
          <summary>{showAll ? 'Tareas enviadas del equipo' : 'Tareas enviadas'}</summary>

          {sentTasks.length === 0 && <p>No hay tareas enviadas.</p>}

          {sentTasks.slice(0, 20).map(task => (
            <div className={`task-card ${normalizeStatus(task.Estado) === 'resuelto' ? 'resolved' : ''}`} key={task.ID_TAREA}>
              <strong>{task.Titulo}</strong>
              {task.Descripcion && <span>{task.Descripcion}</span>}
              <span>De: {task.Creado_Por_Nombre} · {task.Creado_Por_Rol}</span>
              <span>Para: {task.Destino_Nombre} · {task.Destino_Rol}</span>
              <span>Estado: {task.Estado} · Prioridad: {task.Prioridad}</span>
              {task.Comentarios && <span>Comentarios: {task.Comentarios}</span>}
              {task.Fecha_Resolucion && <span>Resuelta: {task.Fecha_Resolucion} · Por: {task.Resuelto_Por}</span>}

              <div className="task-actions">
                <button className="btn secondary" onClick={() => editInternalTask(task)}>
                  Editar
                </button>
              </div>
            </div>
          ))}
        </details>
      </section>
    );
  }

  const groupStudents = useMemo(() => {
    return tutorStudents.filter(s => s.Grupo_App === selectedGroup);
  }, [tutorStudents, selectedGroup]);

  const filteredTutorStudents = useMemo(() => {
    const q = normalize(tutorSearch);
    if (!q) return [];

    return tutorStudents
      .filter(s => {
        const text = normalize(`
          ${s.Nombre || ''}
          ${s.Apellido || ''}
          ${s.Nombre_Completo || ''}
          ${s.CI || ''}
          ${s.Documento || ''}
          ${s.Cedula || ''}
          ${s.Cédula || ''}
          ${s.Usuario || ''}
          ${s.Grupo_App || ''}
        `);

        return text.includes(q);
      })
      .slice(0, 20);
  }, [tutorStudents, tutorSearch]);

  const filteredInfodeskStudents = useMemo(() => {
    const q = normalize(infodeskSearch);
    if (!q) return [];

    return students
      .filter(s => {
        const text = normalize(`
          ${s.Nombre || ''}
          ${s.Apellido || ''}
          ${s.Nombre_Completo || ''}
          ${s.CI || ''}
          ${s.Documento || ''}
          ${s.Cedula || ''}
          ${s.Cédula || ''}
          ${s.Usuario || ''}
          ${s.Grupo_App || ''}
          ${s.Tutor_TUMO || ''}
        `);

        return text.includes(q);
      })
      .slice(0, 20);
  }, [students, infodeskSearch]);


  const filteredQuickLoanStudents = useMemo(() => {
    const q = normalize(quickLoanSearch);
    if (!q || quickLoanStudent) return [];

    return students
      .filter(s => {
        const text = normalize(`
          ${s.Nombre || ''}
          ${s.Apellido || ''}
          ${s.Nombre_Completo || ''}
          ${s.CI || ''}
          ${s.Documento || ''}
          ${s.Cedula || ''}
          ${s.Cédula || ''}
          ${s.Usuario || ''}
          ${s.Grupo_App || ''}
          ${s.Tutor_TUMO_Actual || ''}
          ${s.Tutor_TUMO || ''}
        `);

        return text.includes(q);
      })
      .slice(0, 10);
  }, [students, quickLoanSearch, quickLoanStudent]);

  const availableMaterials = useMemo(() => {
    return materials
      .filter(m => normalizeStatus(m.Estado) !== 'prestado')
      .filter((m, index, arr) => {
        const id = String(m.ID_MATERIAL || '').trim();

        if (!id) return true;

        return arr.findIndex(x => String(x.ID_MATERIAL || '').trim() === id) === index;
      });
  }, [materials]);


  const sortedOpenLoans = useMemo(() => {
    return [...openLoans].sort((a, b) => {
      const materialA = getMaterialSortValue(a);
      const materialB = getMaterialSortValue(b);

      if (materialA.prefix !== materialB.prefix) {
        return materialA.prefix.localeCompare(materialB.prefix);
      }

      if (materialA.number !== materialB.number) {
        return materialA.number - materialB.number;
      }

      return String(a.Alumno || '').localeCompare(String(b.Alumno || ''));
    });
  }, [openLoans]);

  const tutorAlerts = useMemo(() => {
    if (!selectedTutor) return [];
    return alerts.filter(alert => normalize(alert.Tutor_TUMO) === normalize(selectedTutor.Nombre));
  }, [alerts, selectedTutor]);

  if (!googleToken) {
    return <LoginScreen onCredential={handleGoogleCredential} />;
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h1>Cargando app...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>TUMO · Gestión interna</h1>
          <p>Infodesk, tutores, talleristas y Team Lead.</p>
        </div>

        <div className="header-actions">
          <span className="header-user">{loggedUser}</span>
          {view !== 'home' && (
            <button className="btn light" onClick={() => setView('home')}>
              Inicio
            </button>
          )}
          <button className="btn light" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {status && <div className="status">{status}</div>}

      {view === 'home' && (
        <main className="home-grid">
          <button className="home-card" onClick={() => setView('selectInfodesk')}>
            <h2>Infodesk</h2>
            <p>Préstamos, devoluciones, materiales, incidencias y llegadas tarde.</p>
            <strong>{initialData.summary?.openLoans || 0} préstamos abiertos</strong>
          </button>

          <button className="home-card" onClick={() => setView('selectTutor')}>
            <h2>Tutores TUMO</h2>
            <p>Grupos, asistencia, alertas y seguimiento de alumnos.</p>
            <strong>{initialData.summary?.tutors || 0} tutores</strong>
          </button>

          <button className="home-card" onClick={() => setView('selectWorkshopLeader')}>
            <h2>Talleristas</h2>
            <p>Asistencia, participación y seguimiento de talleres.</p>
            <strong>{initialData.summary?.workshopLeaders || 0} líderes</strong>
          </button>

          <button className="home-card" onClick={() => setView('selectTeamLead')}>
            <h2>Team Lead</h2>
            <p>Mensajes, tareas y seguimiento interno del equipo.</p>
            <strong>{initialData.summary?.pendingInternalMessages || 0} mensajes pendientes</strong>
          </button>
        </main>
      )}

      {view === 'selectInfodesk' && (
        <main className="card">
          <h2>¿Quién está en Infodesk?</h2>

          <div className="tutor-grid">
            {infodeskPeople.map(person => (
              <button
                className="tutor-card"
                key={person.ID_PERSONA || person.ID_PERSONA_INFODESK || person.Nombre}
                onClick={() => openInfodesk(person.Nombre)}
              >
                {person.Nombre}
              </button>
            ))}
          </div>
        </main>
      )}

      {view === 'infodesk' && (
        <main className="grid-main">
          <section className="card">
            <h2>Infodesk</h2>
            <p><strong>Registrando como:</strong> {selectedInfodesk}</p>

            <section className="subsection quick-loan-section">
              <div className="section-title-row">
                <h3>Préstamo rápido de material</h3>
                <span className="quick-loan-count">{availableMaterials.length} disponibles</span>
              </div>

              <label>Buscar alumno</label>
              <input
                value={quickLoanSearch}
                onChange={e => {
                  setQuickLoanSearch(e.target.value);
                  setQuickLoanStudent(null);
                }}
                placeholder="Nombre, usuario, cédula o grupo..."
              />

              {filteredQuickLoanStudents.length > 0 && (
                <div className="search-results quick-loan-results">
                  {filteredQuickLoanStudents.map(student => (
                    <button
                      className="search-item"
                      key={student.ID_ALUMNO}
                      onClick={() => {
                        setQuickLoanStudent(student);
                        setQuickLoanSearch(student.Nombre_Completo || `${student.Nombre || ''} ${student.Apellido || ''}`.trim());
                      }}
                    >
                      <strong>{student.Nombre_Completo || `${student.Nombre || ''} ${student.Apellido || ''}`}</strong>
                      <span>{student.Grupo_App} · {student.Usuario}</span>
                    </button>
                  ))}
                </div>
              )}

              {quickLoanStudent && (
                <div className="quick-selected-student">
                  <strong>{quickLoanStudent.Nombre_Completo || `${quickLoanStudent.Nombre || ''} ${quickLoanStudent.Apellido || ''}`}</strong>
                  <span>{quickLoanStudent.Grupo_App} · {quickLoanStudent.Usuario}</span>
                  <button
                    className="tiny-btn"
                    onClick={() => {
                      setQuickLoanStudent(null);
                      setQuickLoanSearch('');
                    }}
                  >
                    Cambiar
                  </button>
                </div>
              )}

              <label>Material disponible</label>
              <select value={quickLoanMaterialId} onChange={e => setQuickLoanMaterialId(e.target.value)}>
                <option value="">Seleccionar material</option>
                {availableMaterials.map((m, index) => (
                  <option
                    key={`${m.ID_MATERIAL || 'SIN-ID'}-${index}`}
                    value={m.ID_MATERIAL || ''}
                    disabled={!m.ID_MATERIAL}
                  >
                    {formatMaterialDisplay(m)} · {m.Estado || 'Disponible'}{!m.ID_MATERIAL ? ' · sin ID en hoja' : ''}
                  </option>
                ))}
              </select>

              <button className="btn success" onClick={createQuickLoan}>
                Registrar préstamo rápido
              </button>
            </section>

            <section className="subsection infodesk-tasks-section">
              <div className="section-title-row">
                <h3>Tareas de Infodesk</h3>

                <button
                  className="btn secondary"
                  onClick={() => setShowInfodeskTaskForm(prev => !prev)}
                >
                  {showInfodeskTaskForm ? 'Ocultar formulario' : 'Nueva tarea'}
                </button>
              </div>

              {showInfodeskTaskForm && (
                <div className="compact-form-card">
                  <label>Título</label>
                  <input
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Ej: Revisar devolución pendiente..."
                  />

                  <label>Descripción</label>
                  <textarea
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    placeholder="Detalle de la tarea..."
                  />

                  <label>Prioridad</label>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                    <option>Baja</option>
                    <option>Media</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>

                  <button className="btn success" onClick={createInfodeskTask}>
                    Guardar tarea
                  </button>
                </div>
              )}

              <div className="task-list">
                {infodeskTasks
                  .filter(task =>
                    task.ID_TAREA &&
                    String(task.Titulo || task.Descripcion || '').trim() &&
                    normalizeStatus(task.Estado) !== 'resuelto'
                  ).length === 0 && <p>No hay tareas pendientes.</p>}

                {infodeskTasks
                  .filter(task =>
                    task.ID_TAREA &&
                    String(task.Titulo || task.Descripcion || '').trim() &&
                    normalizeStatus(task.Estado) !== 'resuelto'
                  )
                  .map(task => (
                    <div className="task-card" key={task.ID_TAREA}>
                      <strong>{task.Titulo}</strong>
                      {task.Descripcion && <span>{task.Descripcion}</span>}
                      <span>Estado: {task.Estado} · Prioridad: {task.Prioridad}</span>
                      <span>Creada: {task.Fecha_Creacion} · Por: {task.Creado_Por}</span>
                      {task.Comentarios && <span>Comentarios: {task.Comentarios}</span>}

                      <div className="task-actions">
                        <button className="btn secondary" onClick={() => editInfodeskTask(task)}>
                          Editar
                        </button>

                        <button className="btn success" onClick={() => resolveInfodeskTask(task)}>
                          Marcar resuelto
                        </button>
                      </div>
                    </div>
                  ))}

                <button
                  className="btn secondary"
                  onClick={() => setShowTaskHistory(true)}
                >
                  Ver historial de tareas
                </button>
              </div>
            </section>


            <h3>Buscar alumno</h3>
            <input
              value={infodeskSearch}
              onChange={e => setInfodeskSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido, cédula, usuario o grupo..."
            />

            {filteredInfodeskStudents.length > 0 && (
              <div className="search-results">
                {filteredInfodeskStudents.map(student => (
                  <button
                    className="search-item"
                    key={student.ID_ALUMNO}
                    onClick={() => selectInfodeskStudent(student)}
                  >
                    <strong>{student.Nombre_Completo || `${student.Nombre || ''} ${student.Apellido || ''}`}</strong>
                    <span>{student.Grupo_App} · {student.Usuario}</span>
                  </button>
                ))}
              </div>
            )}

            <section className="card infodesk-profile-card">
              <h2>Perfil del alumno</h2>

              {!infodeskProfile && <p>Buscá y seleccioná un alumno.</p>}

              {infodeskProfile && (
                <InfodeskStudentProfile profile={infodeskProfile} />
              )}

              {infodeskProfile && infodeskStudent && (
                <section className="profile-actions-card">
                  <h3>Acciones rápidas</h3>

                  <label>Hora de llegada tarde</label>
                  <input
                    type="time"
                    value={lateTime}
                    onChange={e => setLateTime(e.target.value)}
                  />

                  <button className="btn success" onClick={registerLateArrival}>
                    Registrar llegada tarde
                  </button>

                  <label>Comentario</label>
                  <textarea
                    placeholder="Comentario desde Infodesk..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button className="btn secondary" onClick={saveInfodeskComment}>
                    Guardar comentario
                  </button>

                  <label>Incidencia</label>
                  <textarea
                    placeholder="Describir incidencia..."
                    value={incidentText}
                    onChange={e => setIncidentText(e.target.value)}
                  />
                  <button className="btn secondary" onClick={createNewIncident}>
                    Guardar incidencia
                  </button>


                </section>
              )}
            </section>

          </section>

          <section className="right-column-stack">
            {renderInternalCommunicationPanel()}

            <section className="card infodesk-open-loans-card">
              <div className="section-title-row">
                <h2>Préstamos abiertos</h2>
                <button className="btn secondary" onClick={() => setShowLoanHistory(true)}>
                  Ver historial
                </button>
              </div>

              {sortedOpenLoans.length === 0 && <p>No hay préstamos abiertos.</p>}

              <div className="open-loans-grid">
                {sortedOpenLoans.map(loan => (
                  <div className="loan-compact-card" key={loan.ID_PRESTAMO}>
                    <div className="loan-compact-title">
                      <span className="loan-student-name">{loan.Alumno || loan.ID_ALUMNO}</span>
                      <span className="loan-material-code">{formatMaterialDisplay(loan)}</span>
                    </div>

                    <div className="loan-compact-meta">
                      <span>{loan.Grupo_App}</span>
                      <span>{loan.Fecha_Prestamo}</span>
                    </div>

                    <div className="loan-compact-actions">
                      <button className="btn success loan-return-btn" onClick={() => closeLoan(loan)}>
                        Devolver
                      </button>
                      <button className="btn danger loan-damaged-btn" onClick={() => closeLoan(loan, 'Dañado', 'Dañado')}>
                        Dañado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>


          </section>
        </main>
      )}

      {view === 'selectTutor' && (
        <main className="card">
          <h2>Seleccionar tutor</h2>

          <div className="tutor-grid">
            {(initialData.tutors || []).map(tutor => (
              <button className="tutor-card" key={tutor.ID_TUTOR} onClick={() => openTutor(tutor)}>
                {tutor.Nombre}
              </button>
            ))}
          </div>
        </main>
      )}

      {view === 'tutor' && (
        <main className="grid-main">
          <section className="card">
            <h2>{selectedTutor?.Nombre}</h2>
            <button
  className="btn secondary"
  onClick={() => createTaskForInfodeskFromTutor()}
>
  Enviar tarea a Infodesk
</button>

            {tutorAlerts.length > 0 && (
              <>
                <h3>Alertas del tutor</h3>

                {tutorAlerts.map(alert => {
                  const alertStudent = tutorStudents.find(
                    s => String(s.ID_ALUMNO) === String(alert.ID_ALUMNO)
                  );

                  return (
                    <div className="alert" key={alert.ID_ALERTA}>
                      <button
                        className="alert-inner-button"
                        onClick={() => alertStudent && openStudentProfile(alertStudent)}
                      >
                        <strong>{alert.Alumno}</strong>
                        <span>{alert.Tipo} · {alert.Motivo}</span>
                        <span>{alert.Grupo_App}</span>
                        <span>Estado: {alert.Estado_Gestion || 'Pendiente'}</span>
                        {alert.Nota && <span>Nota: {alert.Nota}</span>}
                        <small>Tocar para abrir ficha</small>
                      </button>

                      <div className="alert-actions">
                        <button
                          className="btn secondary"
                          onClick={() => manageAlert(alert, 'Contactado')}
                        >
                          Contactado
                        </button>

                        <button
                          className="btn success"
                          onClick={() => manageAlert(alert, 'Resuelto')}
                        >
                          Resuelto
                        </button>

                        <button
                          className="btn danger"
                          onClick={() => manageAlert(alert, 'Derivado')}
                        >
                          Derivado
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <label>Grupo</label>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              <option value="">Seleccionar grupo</option>
              {tutorGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <label>Fecha</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
            />

            <button className="btn success" onClick={saveGroupAttendance}>Guardar lista</button>

            <h3>Buscar alumno</h3>
            <input
              value={tutorSearch}
              onChange={e => setTutorSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido, cédula, usuario o grupo..."
            />

            {filteredTutorStudents.length > 0 && (
              <div className="search-results">
                {filteredTutorStudents.map(student => (
                  <button
                    className="search-item"
                    key={student.ID_ALUMNO}
                    onClick={() => openStudentProfile(student)}
                  >
                    <strong>{student.Nombre_Completo || `${student.Nombre || ''} ${student.Apellido || ''}`}</strong>
                    <span>{student.Grupo_App} · {student.Usuario}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="attendance-list-header">
              <h3>Alumnos</h3>
              <span>{groupStudents.length} alumnos</span>
            </div>

            <div className="attendance-list">
              {groupStudents.map(student => {
                const row = attendanceRows[String(student.ID_ALUMNO)] || {};
                const estado = row.estado || '';

                return (
                  <div className="attendance-row-card" key={student.ID_ALUMNO}>
                    <div className="attendance-row-main">
                      <div className="attendance-student-info">
                        <strong>{student.Nombre_Completo}</strong>
                        <span>{student.Usuario}</span>
                      </div>

                      <AttendanceDots
                        items={buildAttendanceDotsItems(
                          student.Ultimas_Asistencias || [],
                          attendanceRows[String(student.ID_ALUMNO)],
                          attendanceDate
                        )}
                      />
                    </div>

                    <div className="attendance-row-controls">
                      <div className="attendance-buttons compact-attendance-buttons">
                        {[
                          ['Presente', 'P'],
                          ['Ausente', 'A'],
                          ['Justificada', 'J'],
                          ['Tarde', 'T']
                        ].map(([option, label]) => (
                          <button
                            key={option}
                            title={option}
                            className={`small-btn compact-status-btn status-${normalizeStatus(option)} ${estado === option ? 'active' : ''}`}
                            onClick={() => setAttendance(student.ID_ALUMNO, option)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {estado === 'Tarde' && (
                        <input
                          className="late-time-inline"
                          type="time"
                          value={row.horaLlegada || currentTime()}
                          onChange={e => setAttendanceLateTime(student.ID_ALUMNO, e.target.value)}
                        />
                      )}

                      <div className="student-actions compact-actions">
                        <button
                          className={`tiny-btn ${row.comentario ? 'has-comment' : ''}`}
                          onClick={() => toggleAttendanceComment(String(student.ID_ALUMNO))}
                        >
                          {row.comentario ? 'Com.' : '+ Com.'}
                        </button>

                        <button className="tiny-btn" onClick={() => openStudentProfile(student)}>
                          Ficha
                        </button>

                        <button
                          className="tiny-btn"
                          onClick={() => createTaskForInfodeskFromTutor(student)}
                        >
                          Tarea
                        </button>
                      </div>
                    </div>

                    {commentOpenRows[String(student.ID_ALUMNO)] && (
                      <textarea
                        className="compact-comment"
                        placeholder="Comentario del día..."
                        value={row.comentario || ''}
                        onChange={e => setAttendanceComment(student.ID_ALUMNO, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {selectedGroup && groupStudents.length > 0 && (
              <div className="bottom-save-attendance">
                <button className="btn success" onClick={saveGroupAttendance}>
                  Guardar lista
                </button>
              </div>
            )}
          </section>

          <section className="right-column-stack">
            {renderInternalCommunicationPanel()}
            <StudentProfile profile={profile} onAddComment={addCommentToStudent} />
          </section>
        </main>
      )}



      {view === 'selectTeamLead' && (
        <main className="card">
          <h2>Seleccionar Team Lead</h2>

          <div className="tutor-grid">
            {internalUsers
              .filter((user, index, arr) =>
                normalizeStatus(user.Rol) === 'team lead' &&
                arr.findIndex(other => String(other.ID_USUARIO) === String(user.ID_USUARIO)) === index
              )
              .map(user => (
                <button
                  className="tutor-card"
                  key={user.ID_USUARIO}
                  onClick={() => openTeamLead(user)}
                >
                  <strong>{user.Nombre}</strong>
                  <span>{user.Rol}</span>
                </button>
              ))}
          </div>
        </main>
      )}

      {view === 'teamLead' && (
        <main className="grid-main">
          <section className="card">
            <h2>Team Lead</h2>
            <p>Panel general de comunicación interna y tareas del equipo.</p>
            {renderInternalCommunicationPanel({ showAll: true })}
          </section>

          <section className="card">
            <h2>Resumen</h2>
            <p><strong>Usuarios internos:</strong> {internalUsers.length}</p>
            <p><strong>Mensajes cargados:</strong> {internalMessages.length}</p>
            <p><strong>Tareas cargadas:</strong> {internalTasks.length}</p>
          </section>
        </main>
      )}

      {view === 'selectWorkshopLeader' && (
        <main className="card">
          <h2>Seleccionar tallerista</h2>

          <div className="tutor-grid">
            {(initialData.workshopLeaders || []).map(leader => (
              <button className="tutor-card" key={leader.ID_LIDER || leader.ID_LIDER_TALLER || leader.Nombre} onClick={() => openWorkshopLeader(leader)}>
                {leader.Nombre}
              </button>
            ))}
          </div>
        </main>
      )}

      {view === 'workshop' && (
        <main className="grid-main">
          <section className="card">
            <h2>{selectedLeader?.Nombre}</h2>

            <label>Taller</label>
            <select
              value={selectedWorkshop?.ID_TALLER || ''}
              onChange={e => {
                const w = workshops.find(x => String(x.ID_TALLER) === String(e.target.value));
                setSelectedWorkshop(w || null);
                setWorkshopRows({});
              }}
            >
              <option value="">Seleccionar taller</option>
              {workshops.map(w => (
                <option key={w.ID_TALLER} value={w.ID_TALLER}>
                  {w.Nombre_Taller} · {w.Area}
                </option>
              ))}
            </select>

            {selectedWorkshop && (
              <>
                <button className="btn success" onClick={saveCurrentWorkshopAttendance}>
                  Guardar lista de taller
                </button>

                <h3>Participantes</h3>

                {(selectedWorkshop.participants || []).map(p => {
                  const row = workshopRows[p.ID_ALUMNO] || {};
                  const estado = row.estado || 'Presente';

                  return (
                    <div className="student-card" key={p.ID_ALUMNO}>
                      <strong>{p.Alumno}</strong>
                      <span>{p.Grupo_App} · Tutor: {p.Tutor_TUMO}</span>

                      <div className="attendance-buttons">
                        {['Presente', 'Ausente', 'Justificada', 'Tarde'].map(option => (
                          <button
                            key={option}
                            className={`small-btn ${estado === option ? 'active' : ''}`}
                            onClick={() => setWorkshopAttendance(p.ID_ALUMNO, 'estado', option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      <label>Participación</label>
                      <select
                        value={row.participacion || ''}
                        onChange={e => setWorkshopAttendance(p.ID_ALUMNO, 'participacion', e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option>Muy buen proceso</option>
                        <option>Buen proceso</option>
                        <option>Necesita apoyo</option>
                        <option>Riesgo de no finalizar</option>
                        <option>No participa</option>
                      </select>

                      <textarea
                        placeholder="Observación del líder..."
                        value={row.comentario || ''}
                        onChange={e => setWorkshopAttendance(p.ID_ALUMNO, 'comentario', e.target.value)}
                      />

                      <label>Requiere acción</label>
                      <select
                        value={row.requiereAccion || 'Solo registro'}
                        onChange={e => setWorkshopAttendance(p.ID_ALUMNO, 'requiereAccion', e.target.value)}
                      >
                        <option>Solo registro</option>
                        <option>Requiere seguimiento del tutor</option>
                        <option>Requiere contacto con familia</option>
                        <option>Requiere coordinación</option>
                        <option>Requiere bienestar</option>
                      </select>

                      <button className="btn secondary" onClick={() => saveWorkshopStudentFollowUp(p)}>
                        Guardar seguimiento
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </section>

          <section className="right-column-stack">
            {renderInternalCommunicationPanel()}

            <section className="card">
              <h2>Alertas</h2>
            {alerts.map(alert => (
              <div className="alert" key={alert.ID_ALERTA}>
                <strong>{alert.Alumno}</strong>
                <span>{alert.Tipo} · {alert.Motivo}</span>
                <span>Estado: {alert.Estado_Gestion || 'Pendiente'}</span>
              </div>
            ))}
            </section>
          </section>
        </main>
      )}

      {showLoanHistory && (
  <div className="modal-backdrop">
    <div className="modal-card">
      <div className="modal-header">
        <h2>Historial general de préstamos</h2>
        <button className="btn light" onClick={() => setShowLoanHistory(false)}>
          Cerrar
        </button>
      </div>

      <GeneralLoanHistory loans={allLoans} />
    </div>
  </div>
)}
      
      {showTaskHistory && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Historial de tareas de Infodesk</h2>
              <button className="btn light" onClick={() => setShowTaskHistory(false)}>
                Cerrar
              </button>
            </div>

            <div className="task-list">
              {infodeskTasks
                .filter(task =>
                  task.ID_TAREA &&
                  String(task.Titulo || task.Descripcion || '').trim() &&
                  normalizeStatus(task.Estado) === 'resuelto'
                ).length === 0 && <p>No hay tareas resueltas.</p>}

              {infodeskTasks
                .filter(task =>
                  task.ID_TAREA &&
                  String(task.Titulo || task.Descripcion || '').trim() &&
                  normalizeStatus(task.Estado) === 'resuelto'
                )
                .map(task => (
                  <div className="task-card resolved" key={task.ID_TAREA}>
                    <strong>{task.Titulo}</strong>
                    {task.Descripcion && <span>{task.Descripcion}</span>}
                    <span>Prioridad: {task.Prioridad}</span>
                    <span>Creada: {task.Fecha_Creacion} · Por: {task.Creado_Por}</span>
                    {task.Comentarios && <span>Comentarios: {task.Comentarios}</span>}
                    {task.Fecha_Resolucion && <span>Resuelta: {task.Fecha_Resolucion} · Por: {task.Resuelto_Por}</span>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfodeskStudentProfile({ profile }) {
  const s = profile.student || {};
  const c = profile.contact || {};

  return (
    <>
      <h3>{s.Nombre_Completo}</h3>
      <p><strong>Grupo:</strong> {s.Grupo_App}</p>
      <p><strong>Estado TUMO:</strong> {s.Estado_TUMO}</p>
      <p><strong>Tutor TUMO:</strong> {getStudentCurrentTutor(s) || 'Sin dato'}</p>
      <p><strong>Tutor anterior:</strong> {getStudentPreviousTutor(s) || 'Sin dato'}</p>
      <p><strong>Usuario:</strong> {s.Usuario}</p>
      <p><strong>CI:</strong> {s.CI || s.Documento || s.Cedula || s.Cédula}</p>

      <h3>Contacto familiar</h3>
      <p><strong>Tutor:</strong> {c.Nombre_Tutor} {c.Apellido_Tutor}</p>
      <p><strong>Relación:</strong> {c.Relacion}</p>
      <p><strong>Teléfono:</strong> {c.Telefono_Tutor}</p>
      <p><strong>Mail:</strong> {c.Mail_Tutor}</p>

      <h3>Últimas asistencias</h3>
      {(profile.attendance || []).slice(0, 5).map(item => (
        <div className="list-item" key={item.ID_REGISTRO}>
          <strong>
            {item.Fecha} · {item.Estado}
            {item.Hora_Llegada ? ` · ${item.Hora_Llegada}` : ''}
          </strong>
          <span>{item.Comentario}</span>
        </div>
      ))}

      <h3>Comentarios recientes</h3>
      {(profile.comments || []).slice(0, 5).map(item => (
        <div className="list-item" key={item.ID_COMENTARIO}>
          <strong>{item.Fecha} · {item.Tipo}</strong>
          <span>{item.Comentario}</span>
        </div>
      ))}

      <h3>Incidencias</h3>
      {(profile.incidents || []).slice(0, 5).map(item => (
        <div className="list-item" key={item.ID_INCIDENCIA}>
          <strong>{item.Fecha} · {item.Tipo}</strong>
          <span>{item.Descripcion}</span>
        </div>
      ))}

      <h3>Historial de préstamos del alumno</h3>
      {(profile.loans || []).length === 0 && <p>No hay préstamos registrados.</p>}
      {(profile.loans || []).map(item => (
        <div className="list-item" key={item.ID_PRESTAMO}>
          <strong>{item.Fecha_Prestamo} · {formatMaterialDisplay(item)}</strong>
          <span>Estado: {item.Estado}</span>
          <span>Entregado por: {item.Entregado_Por}</span>
          {item.Fecha_Devolucion && <span>Devuelto: {item.Fecha_Devolucion}</span>}
          {item.Recibido_Por && <span>Recibido por: {item.Recibido_Por}</span>}
          {item.Observaciones && <span>{item.Observaciones}</span>}
        </div>
      ))}
    </>
  );
}

function GeneralLoanHistory({ loans }) {
  if (!loans || loans.length === 0) {
    return <p>No hay préstamos registrados.</p>;
  }

  return (
    <div>
      {loans.map(loan => (
        <div className="list-item" key={loan.ID_PRESTAMO}>
          <strong>{loan.Fecha_Prestamo} · {loan.Alumno || loan.ID_ALUMNO}</strong>
          <span>Material: {formatMaterialDisplay(loan)}</span>
          <span>Estado: {loan.Estado}</span>
          <span>Grupo: {loan.Grupo_App}</span>
          <span>Tutor TUMO: {loan.Tutor_TUMO}</span>
          <span>Entregado por: {loan.Entregado_Por}</span>
          {loan.Fecha_Devolucion && <span>Fecha devolución: {loan.Fecha_Devolucion}</span>}
          {loan.Recibido_Por && <span>Recibido por: {loan.Recibido_Por}</span>}
          {loan.Observaciones && <span>Observaciones: {loan.Observaciones}</span>}
        </div>
      ))}
    </div>
  );
}

function StudentProfile({ profile, onAddComment }) {
  if (!profile) {
    return (
      <section className="card">
        <h2>Ficha del alumno</h2>
        <p>Seleccioná un alumno.</p>
      </section>
    );
  }

  const s = profile.student || {};
  const c = profile.contact || {};

  return (
    <section className="card">
      <h2>Ficha del alumno</h2>
      <h3>{s.Nombre_Completo}</h3>

      <p><strong>Grupo:</strong> {s.Grupo_App}</p>
      <p><strong>Tutor TUMO:</strong> {getStudentCurrentTutor(s) || 'Sin dato'}</p>
      <p><strong>Tutor anterior:</strong> {getStudentPreviousTutor(s) || 'Sin dato'}</p>
      <p><strong>Usuario:</strong> {s.Usuario}</p>

      <h3>Contacto familiar</h3>
      <p><strong>Tutor:</strong> {c.Nombre_Tutor} {c.Apellido_Tutor}</p>
      <p><strong>Teléfono:</strong> {c.Telefono_Tutor}</p>
      <p><strong>Mail:</strong> {c.Mail_Tutor}</p>

      <button className="btn success" onClick={onAddComment}>
        Agregar comentario
      </button>

      <h3>Últimas asistencias</h3>
      {(profile.attendance || []).map(item => (
        <div className="list-item" key={item.ID_REGISTRO}>
          <strong>
            {item.Fecha} · {item.Estado}
            {item.Hora_Llegada ? ` · ${item.Hora_Llegada}` : ''}
          </strong>
          <span>{item.Comentario}</span>
        </div>
      ))}

      <h3>Comentarios</h3>
      {(profile.comments || []).map(item => (
        <div className="list-item" key={item.ID_COMENTARIO}>
          <strong>{item.Fecha} · {item.Tipo}</strong>
          <span>{item.Comentario}</span>
        </div>
      ))}

      <h3>Historial de préstamos</h3>
      {(profile.loans || []).length === 0 && <p>No hay préstamos registrados.</p>}
      {(profile.loans || []).map(item => (
        <div className="list-item" key={item.ID_PRESTAMO}>
          <strong>{item.Fecha_Prestamo} · {formatMaterialDisplay(item)}</strong>
          <span>Estado: {item.Estado}</span>
          <span>Entregado por: {item.Entregado_Por}</span>
          {item.Fecha_Devolucion && <span>Devuelto: {item.Fecha_Devolucion}</span>}
          {item.Recibido_Por && <span>Recibido por: {item.Recibido_Por}</span>}
        </div>
      ))}
    </section>
  );
}

function buildAttendanceDotsItems(items, currentRow, currentDate) {
  const cleanItems = [...items].filter(item => String(item.Fecha) !== String(currentDate));

  if (currentRow && String(currentRow.estado || '').trim()) {
    cleanItems.push({
      Fecha: currentDate,
      Estado: currentRow.estado,
      Estado_Asistencia: currentRow.estado,
      estado: currentRow.estado,
      Hora_Llegada: currentRow.horaLlegada || '',
      Comentario: currentRow.comentario || '',
      comentario: currentRow.comentario || ''
    });
  }

  return cleanItems.slice(-5);
}

function AttendanceDots({ items }) {
  const lastFive = [...items].slice(-5);
  const emptyCount = Math.max(0, 5 - lastFive.length);
  const dots = [
    ...Array(emptyCount).fill(null),
    ...lastFive
  ];

  return (
    <div className="attendance-dots">
      {dots.map((item, index) => {
        if (!item) {
          return <span key={index} className="dot empty" title="Sin registro" />;
        }

        const rawEstado = item.Estado || item.Estado_Asistencia || item.estado || '';
        const estado = normalizeStatus(rawEstado);
        const comentario = item.Comentario || item.comentario || '';
        const hasComment = Boolean(String(comentario).trim());

        let className = 'dot empty';

        if (estado.includes('ausente') || estado.includes('falta')) {
          className = 'dot absent';
        } else if (estado.includes('justificada') || estado.includes('justificado')) {
          className = 'dot justified';
        } else if (estado.includes('tarde')) {
          className = 'dot late';
        } else if (estado.includes('presente') && hasComment) {
          className = 'dot present-comment';
        } else if (estado.includes('presente')) {
          className = 'dot present';
        }

        return (
          <span
            key={index}
            className={className}
            title={`${item.Fecha || ''} · ${rawEstado || ''}${hasComment ? ' · con comentario' : ''}`}
          />
        );
      })}
    </div>
  );
}



function getStudentCurrentTutor(student = {}) {
  return (
    student.Tutor_TUMO_Actual ||
    student.Tutor_TUMO ||
    student.Tutor ||
    student.Tutor_Actual ||
    student.Nombre_Tutor_TUMO ||
    student.Coach ||
    ''
  );
}

function getStudentPreviousTutor(student = {}) {
  return (
    student.Tutor_TUMO_Anterior ||
    student.Tutor_Anterior ||
    student.TutorAnterior ||
    student.Coach_Anterior ||
    student.CoachAnterior ||
    student.Anterior_Tutor ||
    ''
  );
}


function getMaterialSortValue(item = {}) {
  const display = formatMaterialDisplay(item);
  const match = String(display || '').match(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)[\s._-]*(\d+)/);

  if (!match) {
    return {
      prefix: String(display || '').toLowerCase(),
      number: Number.MAX_SAFE_INTEGER
    };
  }

  return {
    prefix: match[1].toLowerCase(),
    number: Number(match[2])
  };
}

function formatMaterialDisplay(item = {}) {
  const tipo = item.Tipo_Material || item.Tipo || item.Material || '';
  const codigo = item.Codigo_Material || item.Codigo || item.Numero || item.Número || item.ID_MATERIAL || '';

  const tipoText = String(tipo || '').trim();
  const codigoText = String(codigo || '').trim();

  if (tipoText && codigoText && !tipoText.includes(codigoText)) {
    return `${tipoText} · ${codigoText}`;
  }

  return tipoText || codigoText || 'Material sin identificar';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeStatus(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function LoginScreen({ onCredential }) {
  const btnRef = useRef(null);

  useEffect(() => {
    function initGoogle() {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: onCredential,
        auto_select: false
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          locale: 'es',
          text: 'signin_with',
          width: 280
        });
      }
      window.google.accounts.id.prompt();
    }

    if (window.google?.accounts) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, [onCredential]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>TUMO</h1>
          <p>Gesti&oacute;n interna</p>
        </div>
        <p className="login-subtitle">
          Ingres&aacute; con tu cuenta Google autorizada para acceder al sistema.
        </p>
        <div ref={btnRef} className="google-signin-btn" />
      </div>
    </div>
  );
}
