import { useEffect, useMemo, useState } from 'react';
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
  getAttendanceForDate
} from './api';
import './styles.css';

export default function App() {
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

  const [infodeskSearch, setInfodeskSearch] = useState('');
  const [infodeskStudent, setInfodeskStudent] = useState(null);
  const [infodeskProfile, setInfodeskProfile] = useState(null);

  const [loanMaterialId, setLoanMaterialId] = useState('');
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

  const [selectedLeader, setSelectedLeader] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopRows, setWorkshopRows] = useState({});

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      setLoading(true);
      const data = await getInitialData();
      setInitialData(data);
      setInfodeskPeople(data.infodeskPeople || []);
      setAlerts(data.alerts || []);
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

      setInfodeskSearch('');
      setInfodeskStudent(null);
      setInfodeskProfile(null);
      setCommentText('');
      setIncidentText('');
      setLoanMaterialId('');
      setLateTime(currentTime());
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
      setStatus('Infodesk actualizado.');
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

  async function createNewLoan() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!infodeskStudent) throw new Error('Seleccioná un alumno.');
      if (!loanMaterialId) throw new Error('Seleccioná un material.');

      const material = materials.find(m => String(m.ID_MATERIAL) === String(loanMaterialId));

      const res = await createLoan({
        idAlumno: infodeskStudent.ID_ALUMNO,
        idMaterial: loanMaterialId,
        material: material?.Tipo || '',
        personaInfodesk: selectedInfodesk
      });

      setStatus(res.message || 'Préstamo registrado.');
      setLoanMaterialId('');
      await refreshInfodesk();
      await selectInfodeskStudent(infodeskStudent);
      await refreshInitialWithoutLoading();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function closeLoan(loan, estadoPrestamo = 'Devuelto', estadoMaterial = 'Disponible') {
    try {
      const res = await returnLoan({
        idPrestamo: loan.ID_PRESTAMO,
        idMaterial: loan.ID_MATERIAL,
        estadoPrestamo,
        estadoMaterial,
        personaInfodesk: selectedInfodesk
      });

      setStatus(res.message || 'Devolución registrada.');
      await refreshInfodesk();
      await refreshInitialWithoutLoading();

      if (infodeskStudent) {
        await selectInfodeskStudent(infodeskStudent);
      }
    } catch (error) {
      setStatus(error.message);
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
      setProfile(null);
      setSelectedStudent(null);

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

      const data = await getAttendanceForDate({
        grupo: group,
        fecha: date
      });

      const rows = {};

      Object.keys(data.records || {}).forEach(idAlumno => {
        const record = data.records[idAlumno];

        rows[idAlumno] = {
          estado: record.Estado || 'Presente',
          horaLlegada: record.Hora_Llegada || '',
          comentario: record.Comentario || ''
        };
      });

      setAttendanceRows(rows);
    } catch (error) {
      setStatus(error.message);
    }
  }

  function setAttendance(idAlumno, estado) {
    setAttendanceRows(prev => ({
      ...prev,
      [idAlumno]: {
        ...(prev[idAlumno] || {}),
        estado,
        horaLlegada: estado === 'Tarde' ? (prev[idAlumno]?.horaLlegada || currentTime()) : ''
      }
    }));
  }

  function setAttendanceComment(idAlumno, comentario) {
    setAttendanceRows(prev => ({
      ...prev,
      [idAlumno]: {
        ...(prev[idAlumno] || {}),
        comentario
      }
    }));
  }

  function setAttendanceLateTime(idAlumno, horaLlegada) {
    setAttendanceRows(prev => ({
      ...prev,
      [idAlumno]: {
        ...(prev[idAlumno] || {}),
        horaLlegada
      }
    }));
  }

  async function saveGroupAttendance() {
    try {
      if (!selectedTutor) throw new Error('Seleccioná un tutor.');
      if (!selectedGroup) throw new Error('Seleccioná un grupo.');

      const groupStudents = tutorStudents.filter(s => s.Grupo_App === selectedGroup);

      const registros = groupStudents.map(s => ({
        idAlumno: s.ID_ALUMNO,
        estado: attendanceRows[s.ID_ALUMNO]?.estado || 'Presente',
        horaLlegada: attendanceRows[s.ID_ALUMNO]?.horaLlegada || '',
        comentario: attendanceRows[s.ID_ALUMNO]?.comentario || ''
      }));

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
      setView('workshop');

      const data = await getWorkshopLeaderData({
        leaderId: leader.ID_LIDER,
        leader: leader.Nombre
      });

      setWorkshops(data.workshops || []);
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

  const tutorAlerts = useMemo(() => {
    if (!selectedTutor) return [];
    return alerts.filter(alert => normalize(alert.Tutor_TUMO) === normalize(selectedTutor.Nombre));
  }, [alerts, selectedTutor]);

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
          <p>Infodesk, tutores y líderes de taller.</p>
        </div>

        {view !== 'home' && (
          <button className="btn light" onClick={() => setView('home')}>
            Volver al inicio
          </button>
        )}
      </header>

      {status && <div className="status">{status}</div>}

      {view === 'home' && (
        <main className="home-grid three">
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
            <h2>Líderes de taller</h2>
            <p>Asistencia, participación y seguimiento de talleres.</p>
            <strong>{initialData.summary?.workshopLeaders || 0} líderes</strong>
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
                key={person.ID_PERSONA}
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

            {infodeskStudent && (
              <>
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

                <h3>Préstamo de material</h3>
                <label>Material disponible</label>
                <select value={loanMaterialId} onChange={e => setLoanMaterialId(e.target.value)}>
                  <option value="">Seleccionar material</option>
                  {materials
                    .filter(m => String(m.Estado || '').toLowerCase() !== 'prestado')
                    .map(m => (
                      <option key={m.ID_MATERIAL} value={m.ID_MATERIAL}>
                        {m.Tipo} · {m.Codigo} · {m.Estado}
                      </option>
                    ))}
                </select>

                <button className="btn success" onClick={createNewLoan}>
                  Registrar préstamo
                </button>
              </>
            )}
          </section>

          <section className="card">
            <h2>Perfil del alumno</h2>

            {!infodeskProfile && <p>Buscá y seleccioná un alumno.</p>}

            {infodeskProfile && (
              <InfodeskStudentProfile profile={infodeskProfile} />
            )}

            <h3>Préstamos abiertos</h3>
            {openLoans.map(loan => (
              <div className="list-item" key={loan.ID_PRESTAMO}>
                <strong>{loan.Alumno}</strong>
                <span>{loan.Material} · {loan.Fecha_Prestamo}</span>
                <span>{loan.Grupo_App}</span>
                <button className="btn success" onClick={() => closeLoan(loan)}>
                  Devolver
                </button>
                <button className="btn danger" onClick={() => closeLoan(loan, 'Dañado', 'Dañado')}>
                  Marcar dañado
                </button>
              </div>
            ))}

            <h3>Historial general de préstamos</h3>
            <GeneralLoanHistory loans={allLoans} />
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
              onChange={e => {
                const group = e.target.value;
                setSelectedGroup(group);
                loadAttendanceForSelectedDate(group, attendanceDate);
              }}
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
              onChange={e => {
                const date = e.target.value;
                setAttendanceDate(date);
                loadAttendanceForSelectedDate(selectedGroup, date);
              }}
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

            <h3>Alumnos</h3>

            {groupStudents.map(student => {
              const row = attendanceRows[student.ID_ALUMNO] || {};
              const estado = row.estado || 'Presente';

              return (
                <div className="student-card" key={student.ID_ALUMNO}>
                  <strong>{student.Nombre_Completo}</strong>

                  <AttendanceDots
                    items={buildAttendanceDotsItems(
                      student.Ultimas_Asistencias || [],
                      attendanceRows[student.ID_ALUMNO],
                      attendanceDate
                    )}
                  />

                  <span>{student.Usuario}</span>
                  
                  <div className="attendance-buttons">
                    {['Presente', 'Ausente', 'Justificada', 'Tarde'].map(option => (
                      <button
                        key={option}
                        className={`small-btn ${estado === option ? 'active' : ''}`}
                        onClick={() => setAttendance(student.ID_ALUMNO, option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {estado === 'Tarde' && (
                    <>
                      <label>Hora de llegada</label>
                      <input
                        type="time"
                        value={row.horaLlegada || currentTime()}
                        onChange={e => setAttendanceLateTime(student.ID_ALUMNO, e.target.value)}
                      />
                    </>
                  )}

                  <textarea
                    placeholder="Comentario del día..."
                    value={row.comentario || ''}
                    onChange={e => setAttendanceComment(student.ID_ALUMNO, e.target.value)}
                  />

                  <button className="btn secondary" onClick={() => openStudentProfile(student)}>
                    Ver ficha
                  </button>
                </div>
              );
            })}
          </section>

          <StudentProfile profile={profile} onAddComment={addCommentToStudent} />
        </main>
      )}

      {view === 'selectWorkshopLeader' && (
        <main className="card">
          <h2>Seleccionar líder de taller</h2>

          <div className="tutor-grid">
            {(initialData.workshopLeaders || []).map(leader => (
              <button className="tutor-card" key={leader.ID_LIDER} onClick={() => openWorkshopLeader(leader)}>
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
        </main>
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
      <p><strong>Tutor TUMO:</strong> {s.Tutor_TUMO}</p>
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
          <strong>{item.Fecha_Prestamo} · {item.Material}</strong>
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
          <span>Material: {loan.Material}</span>
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
      <p><strong>Tutor:</strong> {s.Tutor_TUMO}</p>
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
          <strong>{item.Fecha_Prestamo} · {item.Material}</strong>
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

  if (currentRow && currentRow.estado) {
    cleanItems.push({
      Fecha: currentDate,
      Estado: currentRow.estado,
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

        const rawEstado = item.Estado || item.estado || '';
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
