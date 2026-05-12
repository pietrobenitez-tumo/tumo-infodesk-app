import { useEffect, useMemo, useState } from 'react';
import {
  getInitialData,
  getTutorData,
  getStudentProfile,
  saveAttendance,
  saveComment,
  createLoan,
  returnLoan,
  getInfodeskData
} from './api';
import './styles.css';

export default function App() {
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [openLoans, setOpenLoans] = useState([]);

  const [selectedTutor, setSelectedTutor] = useState('');
  const [tutorStudents, setTutorStudents] = useState([]);
  const [tutorGroups, setTutorGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');

  const [attendanceDate, setAttendanceDate] = useState(today());
  const [attendanceRows, setAttendanceRows] = useState({});

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profile, setProfile] = useState(null);

  const [search, setSearch] = useState('');
  const [loanStudentId, setLoanStudentId] = useState('');
  const [loanMaterialId, setLoanMaterialId] = useState('');

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    try {
      setLoading(true);
      const data = await getInitialData();

      setStudents(data.students || []);
      setTutors(data.tutors || []);
      setAlerts(data.alerts || []);
      setMaterials(data.materials || []);
      setOpenLoans(data.openLoans || []);

      setStatus('');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshInfodesk() {
    try {
      const data = await getInfodeskData();
      setMaterials(data.materials || []);
      setOpenLoans(data.openLoans || []);
      setStatus('Infodesk actualizado.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function selectTutor(tutor) {
    try {
      setSelectedTutor(tutor);
      setSelectedGroup('');
      setTutorStudents([]);
      setTutorGroups([]);
      setAttendanceRows({});
      setProfile(null);
      setSelectedStudent(null);

      const data = await getTutorData(tutor);

      setTutorStudents(data.students || []);
      setTutorGroups(data.groups || []);

      setView('tutorPanel');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function openProfile(student) {
    try {
      setSelectedStudent(student);
      const data = await getStudentProfile(student.ID_ALUMNO);
      setProfile(data);
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

      const groupStudents = tutorStudents.filter(s => s.Grupo === selectedGroup);

      const registros = groupStudents.map(s => ({
        idAlumno: s.ID_ALUMNO,
        estado: attendanceRows[s.ID_ALUMNO]?.estado || 'Presente',
        comentario: attendanceRows[s.ID_ALUMNO]?.comentario || ''
      }));

      const res = await saveAttendance({
        fecha: attendanceDate,
        grupo: selectedGroup,
        registradoPor: selectedTutor,
        registros
      });

      setStatus(res.message || 'Asistencia guardada.');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function addCommentToStudent() {
    try {
      if (!selectedStudent) throw new Error('Seleccioná un alumno.');

      const comentario = prompt('Comentario:');
      if (!comentario) return;

      const res = await saveComment({
        idAlumno: selectedStudent.ID_ALUMNO,
        tipo: 'General',
        comentario,
        registradoPor: selectedTutor || 'Tutor'
      });

      setStatus(res.message || 'Comentario guardado.');
      openProfile(selectedStudent);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function createNewLoan() {
    try {
      if (!loanStudentId) throw new Error('Seleccioná un alumno.');
      if (!loanMaterialId) throw new Error('Seleccioná un material.');

      const material = materials.find(m => String(m.ID_MATERIAL) === String(loanMaterialId));

      const res = await createLoan({
        idAlumno: loanStudentId,
        idMaterial: loanMaterialId,
        material: material?.Tipo || '',
        entregadoPor: 'Infodesk'
      });

      setStatus(res.message || 'Préstamo registrado.');
      setLoanStudentId('');
      setLoanMaterialId('');
      await refreshInfodesk();
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function closeLoan(loan) {
    try {
      const res = await returnLoan({
        idPrestamo: loan.ID_PRESTAMO,
        idMaterial: loan.ID_MATERIAL,
        recibidoPor: 'Infodesk',
        estadoMaterial: 'Disponible'
      });

      setStatus(res.message || 'Devolución registrada.');
      await refreshInfodesk();
    } catch (error) {
      setStatus(error.message);
    }
  }

  const filteredStudents = useMemo(() => {
    const q = normalize(search);

    if (!q) return students;

    return students.filter(s => {
      const text = normalize(`${s.Nombre} ${s.Apellido} ${s.Usuario} ${s.Grupo} ${s.Tutor_TUMO}`);
      return text.includes(q);
    });
  }, [students, search]);

  const groupStudents = useMemo(() => {
    if (!selectedGroup) return [];
    return tutorStudents.filter(s => s.Grupo === selectedGroup);
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
          <h1>TUMO · Seguimiento e Infodesk</h1>
          <p>Asistencia, seguimiento de alumnos, préstamos y tareas internas.</p>
        </div>

        {view !== 'home' && (
          <button className="btn light" onClick={() => setView('home')}>
            Volver al inicio
          </button>
        )}
      </header>

      {status && (
        <div className="status">
          {status}
        </div>
      )}

      {view === 'home' && (
        <main className="home-grid">
          <button className="home-card" onClick={() => setView('infodesk')}>
            <h2>Infodesk</h2>
            <p>Préstamos, devoluciones, materiales y tareas de atención.</p>
            <strong>{openLoans.length} préstamos abiertos</strong>
          </button>

          <button className="home-card" onClick={() => setView('tutors')}>
            <h2>Tutores</h2>
            <p>Seleccionar tutor, ver grupos, pasar lista y hacer seguimiento.</p>
            <strong>{tutors.length} tutores cargados</strong>
          </button>
        </main>
      )}

      {view === 'infodesk' && (
        <main className="grid-two">
          <section className="card">
            <h2>Infodesk</h2>

            <div className="mini-grid">
              <div className="stat">
                <strong>{materials.length}</strong>
                <span>Materiales</span>
              </div>
              <div className="stat">
                <strong>{openLoans.length}</strong>
                <span>Préstamos abiertos</span>
              </div>
            </div>

            <h3>Registrar préstamo</h3>

            <label>Alumno</label>
            <select value={loanStudentId} onChange={e => setLoanStudentId(e.target.value)}>
              <option value="">Seleccionar alumno</option>
              {students.map(s => (
                <option key={s.ID_ALUMNO} value={s.ID_ALUMNO}>
                  {s.Nombre} {s.Apellido} · {s.Grupo}
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

            <button className="btn success" onClick={createNewLoan}>
              Registrar préstamo
            </button>

            <button className="btn secondary" onClick={refreshInfodesk}>
              Actualizar Infodesk
            </button>
          </section>

          <section className="card">
            <h2>Préstamos abiertos</h2>

            {openLoans.length === 0 && <p>No hay préstamos abiertos.</p>}

            {openLoans.map(loan => (
              <div className="list-item" key={loan.ID_PRESTAMO}>
                <strong>{loan.Alumno || loan.ID_ALUMNO}</strong>
                <span>{loan.Material} · {loan.Fecha_Prestamo}</span>
                <span>{loan.Grupo}</span>
                <button className="btn danger" onClick={() => closeLoan(loan)}>
                  Registrar devolución
                </button>
              </div>
            ))}
          </section>
        </main>
      )}

      {view === 'tutors' && (
        <main className="card">
          <h2>Seleccionar tutor</h2>

          {tutors.length === 0 && (
            <p>No se encontraron tutores. Revisá que la hoja ALUMNOS tenga la columna Tutor_TUMO.</p>
          )}

          <div className="tutor-grid">
            {tutors.map(tutor => (
              <button className="tutor-card" key={tutor} onClick={() => selectTutor(tutor)}>
                {tutor}
              </button>
            ))}
          </div>
        </main>
      )}

      {view === 'tutorPanel' && (
        <main className="grid-main">
          <section className="card">
            <h2>{selectedTutor}</h2>

            <label>Grupo</label>
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
              <option value="">Seleccionar grupo</option>
              {tutorGroups.map(group => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <label>Fecha</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
            />

            <button className="btn success" onClick={saveGroupAttendance}>
              Guardar lista del grupo
            </button>

            <h3>Alumnos del grupo</h3>

            {!selectedGroup && <p>Seleccioná un grupo.</p>}

            {groupStudents.map(student => {
              const row = attendanceRows[student.ID_ALUMNO] || {};
              const estado = row.estado || 'Presente';

              return (
                <div className="student-card" key={student.ID_ALUMNO}>
                  <div>
                    <strong>{student.Nombre} {student.Apellido}</strong>
                    <span>{student.Usuario}</span>
                  </div>

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

                  <button className="btn secondary" onClick={() => openProfile(student)}>
                    Ver ficha
                  </button>
                </div>
              );
            })}
          </section>

          <section className="card">
            <h2>Ficha del alumno</h2>

            {!profile && <p>Seleccioná un alumno para ver su ficha.</p>}

            {profile && (
              <>
                <h3>{profile.alumno.Nombre} {profile.alumno.Apellido}</h3>

                <p><strong>Usuario:</strong> {profile.alumno.Usuario}</p>
                <p><strong>Grupo:</strong> {profile.alumno.Grupo}</p>
                <p><strong>Tutor:</strong> {profile.alumno.Tutor_TUMO}</p>

                <h3>Contacto familiar</h3>
                <p><strong>Tutor:</strong> {profile.contacto.Nombre_Tutor} {profile.contacto.Apellido_Tutor}</p>
                <p><strong>Teléfono:</strong> {profile.contacto.Telefono_Tutor}</p>
                <p><strong>Mail:</strong> {profile.contacto.Mail_Tutor}</p>

                <button className="btn success" onClick={addCommentToStudent}>
                  Agregar comentario
                </button>

                <h3>Últimas asistencias</h3>
                {(profile.asistencia || []).map(item => (
                  <div className="list-item" key={item.ID_REGISTRO}>
                    <strong>{item.Fecha} · {item.Estado}</strong>
                    <span>{item.Comentario}</span>
                  </div>
                ))}

                <h3>Comentarios</h3>
                {(profile.comentarios || []).map(item => (
                  <div className="list-item" key={item.ID_COMENTARIO}>
                    <strong>{item.Fecha} · {item.Tipo}</strong>
                    <span>{item.Comentario}</span>
                  </div>
                ))}
              </>
            )}
          </section>
        </main>
      )}

      {view === 'search' && (
        <main className="card">
          <input
            placeholder="Buscar alumno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filteredStudents.map(s => (
            <div className="list-item" key={s.ID_ALUMNO}>
              <strong>{s.Nombre} {s.Apellido}</strong>
              <span>{s.Grupo}</span>
            </div>
          ))}
        </main>
      )}

      {alerts.length > 0 && view !== 'home' && (
        <section className="card">
          <h2>Alertas</h2>

          {alerts.map(alert => (
            <div className="alert" key={alert.ID_ALUMNO}>
              <strong>{alert.Alumno}</strong>
              <span>{alert.Motivo}</span>
              <span>{alert.Ultimos_Estados}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
