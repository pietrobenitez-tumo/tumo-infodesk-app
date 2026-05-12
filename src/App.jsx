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
  saveWorkshopFollowUp
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
  const [incidents, setIncidents] = useState([]);
  const [loanStudentId, setLoanStudentId] = useState('');
  const [loanMaterialId, setLoanMaterialId] = useState('');
  const [incidentText, setIncidentText] = useState('');

  const [selectedTutor, setSelectedTutor] = useState(null);
  const [tutorStudents, setTutorStudents] = useState([]);
  const [tutorGroups, setTutorGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
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

  async function openInfodesk(personName) {
    try {
      setSelectedInfodesk(personName);
      setView('infodesk');
      const data = await getInfodeskData();
      setStudents(data.students || []);
      setMaterials(data.materials || []);
      setOpenLoans(data.openLoans || []);
      setIncidents(data.incidents || []);
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
      setIncidents(data.incidents || []);
      setStatus('Infodesk actualizado.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function createNewLoan() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!loanStudentId) throw new Error('Seleccioná un alumno.');
      if (!loanMaterialId) throw new Error('Seleccioná un material.');

      const material = materials.find(m => String(m.ID_MATERIAL) === String(loanMaterialId));

      const res = await createLoan({
        idAlumno: loanStudentId,
        idMaterial: loanMaterialId,
        material: material?.Tipo || '',
        personaInfodesk: selectedInfodesk
      });

      setStatus(res.message || 'Préstamo registrado.');
      setLoanStudentId('');
      setLoanMaterialId('');
      await refreshInfodesk();
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
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function createNewIncident() {
    try {
      if (!selectedInfodesk) throw new Error('Seleccioná quién está registrando en Infodesk.');
      if (!incidentText.trim()) throw new Error('Escribí la incidencia.');

      const res = await saveIncident({
        descripcion: incidentText,
        tipo: 'Infodesk',
        estado: 'Abierta',
        personaInfodesk: selectedInfodesk,
        derivadoA: ''
      });

      setStatus(res.message || 'Incidencia registrada.');
      setIncidentText('');
      await refreshInfodesk();
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

  function setAttendance(idAlumno, estado) {
    setAttendanceRows(prev => ({
      ...prev,
      [idAlumno]: {
        ...(prev[idAlumno] || {}),
        estado
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

  async function saveGroupAttendance() {
    try {
      if (!selectedTutor) throw new Error('Seleccioná un tutor.');
      if (!selectedGroup) throw new Error('Seleccioná un grupo.');

      const groupStudents = tutorStudents.filter(s => s.Grupo_App === selectedGroup);

      const registros = groupStudents.map(s => ({
        idAlumno: s.ID_ALUMNO,
        estado: attendanceRows[s.ID_ALUMNO]?.estado || 'Presente',
        comentario: attendanceRows[s.ID_ALUMNO]?.comentario || ''
      }));

      const res = await saveAttendance({
        fecha: attendanceDate,
        grupo: selectedGroup,
        registradoPor: selectedTutor.Nombre,
        registros
      });

      setStatus(res.message || 'Lista guardada.');
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
    } catch (error) {
      setStatus(error.message);
    }
  }

  const groupStudents = useMemo(() => {
    return tutorStudents.filter(s => s.Grupo_App === selectedGroup);
  }, [tutorStudents, selectedGroup]);

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
            <p>Préstamos, devoluciones, materiales e incidencias.</p>
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
        <main className="grid-two">
          <section className="card">
            <h2>Infodesk</h2>
            <p><strong>Registrando como:</strong> {selectedInfodesk}</p>

            <h3>Registrar préstamo</h3>

            <label>Alumno</label>
            <select value={loanStudentId} onChange={e => setLoanStudentId(e.target.value)}>
              <option value="">Seleccionar alumno</option>
              {students.map(s => (
                <option key={s.ID_ALUMNO} value={s.ID_ALUMNO}>
                  {s.Nombre_Completo || `${s.Nombre} ${s.Apellido}`} · {s.Grupo_App}
                </option>
              ))}
            </select>

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

            <button className="btn success" onClick={createNewLoan}>Registrar préstamo</button>

            <h3>Registrar incidencia</h3>
            <textarea
              placeholder="Describir incidencia..."
              value={incidentText}
              onChange={e => setIncidentText(e.target.value)}
            />
            <button className="btn secondary" onClick={createNewIncident}>Guardar incidencia</button>
          </section>

          <section className="card">
            <h2>Préstamos abiertos</h2>

            {openLoans.map(loan => (
              <div className="list-item" key={loan.ID_PRESTAMO}>
                <strong>{loan.Alumno}</strong>
                <span>{loan.Material} · {loan.Fecha_Prestamo}</span>
                <span>{loan.Grupo_App}</span>
                <button className="btn success" onClick={() => closeLoan(loan)}>Devolver</button>
                <button className="btn danger" onClick={() => closeLoan(loan, 'Dañado', 'Dañado')}>Marcar dañado</button>
              </div>
            ))}
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

            <label>Grupo</label>
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
              <option value="">Seleccionar grupo</option>
              {tutorGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <label>Fecha</label>
            <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />

            <button className="btn success" onClick={saveGroupAttendance}>Guardar lista</button>

            <h3>Alumnos</h3>

            {groupStudents.map(student => {
              const row = attendanceRows[student.ID_ALUMNO] || {};
              const estado = row.estado || 'Presente';

              return (
                <div className="student-card" key={student.ID_ALUMNO}>
                  <strong>{student.Nombre_Completo}</strong>
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
              </div>
            ))}
          </section>
        </main>
      )}
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
          <strong>{item.Fecha} · {item.Estado}</strong>
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
    </section>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
