import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Headphones,
  MessageSquare,
  Search,
  User,
  XCircle
} from 'lucide-react';
import {
  createLoan,
  getInitialData,
  getOpenLoans,
  getStudentProfile,
  returnLoan,
  saveAttendance,
  saveComment,
  saveIncident,
  saveMaterial
} from './api';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [view, setView] = useState('inicio');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [openLoans, setOpenLoans] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [attendanceState, setAttendanceState] = useState({});
  const [attendanceComment, setAttendanceComment] = useState({});
  const [commentForm, setCommentForm] = useState({ tipo: 'General', comentario: '', proximaAccion: '' });
  const [incidentForm, setIncidentForm] = useState({ tipo: 'General', descripcion: '' });
  const [loanForm, setLoanForm] = useState({ idMaterial: '', observaciones: '' });
  const [materialForm, setMaterialForm] = useState({ Tipo: 'Auricular', Codigo: '', Estado: 'Disponible', Observaciones: '' });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const data = await getInitialData();
      setStudents(data.students || []);
      setGroups(data.groups || []);
      setAlerts(data.alerts || []);
      setMaterials(data.materials || []);
      setOpenLoans(data.openLoans || []);
      if (!selectedGroup && data.groups?.length) setSelectedGroup(data.groups[0]);
      setStatus('');
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openStudent(student) {
    try {
      setSelectedStudent(student);
      setView('alumno');
      const res = await getStudentProfile(student.ID_ALUMNO);
      setProfile(res);
      setCommentForm({ tipo: 'General', comentario: '', proximaAccion: '' });
      setIncidentForm({ tipo: 'General', descripcion: '' });
      setLoanForm({ idMaterial: '', observaciones: '' });
    } catch (err) {
      setStatus(err.message);
    }
  }

  const filteredStudents = useMemo(() => {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return students.filter(s => {
      const text = `${s.Alumno} ${s.Usuario} ${s.Grupo} ${s.TUMO_ID}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return text.includes(q);
    });
  }, [students, query]);

  const groupStudents = useMemo(() => {
    return students.filter(s => !selectedGroup || s.Grupo === selectedGroup);
  }, [students, selectedGroup]);

  const availableMaterials = useMemo(() => {
    return materials.filter(m => String(m.Estado || '').toLowerCase() === 'disponible');
  }, [materials]);

  function markAttendance(idAlumno, estado) {
    setAttendanceState(prev => ({ ...prev, [idAlumno]: estado }));
  }

  async function saveGroupAttendance() {
    try {
      const registros = groupStudents.map(s => ({
        idAlumno: s.ID_ALUMNO,
        alumno: s.Alumno,
        estado: attendanceState[s.ID_ALUMNO] || 'Presente',
        comentario: attendanceComment[s.ID_ALUMNO] || ''
      }));

      const res = await saveAttendance({
        fecha: attendanceDate,
        grupo: selectedGroup,
        registradoPor: 'Pietro',
        registros
      });

      setStatus(res.message);
      await loadAll();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function saveSingleAttendance(estado) {
    if (!selectedStudent) return;

    try {
      const res = await saveAttendance({
        fecha: today(),
        grupo: selectedStudent.Grupo,
        registradoPor: 'Pietro',
        registros: [{
          idAlumno: selectedStudent.ID_ALUMNO,
          alumno: selectedStudent.Alumno,
          estado,
          comentario: ''
        }]
      });

      setStatus(res.message);
      await openStudent(selectedStudent);
      await loadAll();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleSaveComment() {
    if (!selectedStudent) return;

    try {
      const res = await saveComment({
        idAlumno: selectedStudent.ID_ALUMNO,
        alumno: selectedStudent.Alumno,
        tipo: commentForm.tipo,
        comentario: commentForm.comentario,
        proximaAccion: commentForm.proximaAccion,
        registradoPor: 'Pietro'
      });

      setStatus(res.message);
      await openStudent(selectedStudent);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleSaveIncident() {
    if (!selectedStudent) return;

    try {
      const res = await saveIncident({
        idAlumno: selectedStudent.ID_ALUMNO,
        alumno: selectedStudent.Alumno,
        tipo: incidentForm.tipo,
        descripcion: incidentForm.descripcion,
        responsable: 'Pietro'
      });

      setStatus(res.message);
      setIncidentForm({ tipo: 'General', descripcion: '' });
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleCreateLoan() {
    if (!selectedStudent) return;

    try {
      const res = await createLoan({
        idAlumno: selectedStudent.ID_ALUMNO,
        alumno: selectedStudent.Alumno,
        idMaterial: loanForm.idMaterial,
        entregadoPor: 'Pietro',
        observaciones: loanForm.observaciones
      });

      setStatus(res.message);
      await loadAll();
      await openStudent(selectedStudent);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleReturnLoan(loan) {
    try {
      const res = await returnLoan({
        idPrestamo: loan.ID_PRESTAMO,
        idMaterial: loan.ID_MATERIAL,
        recibidoPor: 'Pietro',
        estadoMaterial: 'Disponible'
      });

      setStatus(res.message);
      await loadAll();
      if (selectedStudent) await openStudent(selectedStudent);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleSaveMaterial() {
    try {
      const res = await saveMaterial(materialForm);
      setStatus(res.message);
      setMaterialForm({ Tipo: 'Auricular', Codigo: '', Estado: 'Disponible', Observaciones: '' });
      await loadAll();
    } catch (err) {
      setStatus(err.message);
    }
  }

  function copyFamilyMessage() {
    if (!profile?.alumno) return;
    const name = profile.alumno.Nombre || profile.alumno.Alumno;
    const text = `Buenas tardes, te escribo por ${name}. Notamos que tuvo dos inasistencias consecutivas en TUMO y queríamos consultar si está todo bien o si hay alguna dificultad para asistir. Quedamos atentos. Saludos, Pietro.`;
    navigator.clipboard.writeText(text);
    setStatus('Mensaje copiado.');
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Seguimiento TUMO + Infodesk</h1>
          <p>Alumnos, asistencia, comentarios, préstamos, devoluciones y alertas.</p>
        </div>
        <button onClick={loadAll}>Actualizar</button>
      </header>

      {status && <div className="status">{status}</div>}

      <nav className="tabs">
        <button className={view === 'inicio' ? 'active' : ''} onClick={() => setView('inicio')}>Inicio</button>
        <button className={view === 'lista' ? 'active' : ''} onClick={() => setView('lista')}>Pasar lista</button>
        <button className={view === 'alumno' ? 'active' : ''} onClick={() => setView('alumno')}>Alumno</button>
        <button className={view === 'infodesk' ? 'active' : ''} onClick={() => setView('infodesk')}>Infodesk</button>
      </nav>

      {loading && <div className="card">Cargando datos...</div>}

      {!loading && view === 'inicio' && (
        <section>
          <div className="kpis">
            <Kpi icon={<User />} label="Alumnos" value={students.length} />
            <Kpi icon={<AlertTriangle />} label="Alertas" value={alerts.length} />
            <Kpi icon={<Headphones />} label="Préstamos abiertos" value={openLoans.length} />
            <Kpi icon={<CheckCircle />} label="Materiales disponibles" value={availableMaterials.length} />
          </div>

          <div className="grid two">
            <div className="card">
              <h2>Alertas por asistencia</h2>
              {alerts.length === 0 && <p className="muted">No hay alertas activas.</p>}
              {alerts.map(a => (
                <div key={`${a.ID_ALUMNO}-${a.Motivo}`} className="alertItem" onClick={() => openStudent(students.find(s => s.ID_ALUMNO === a.ID_ALUMNO))}>
                  <strong>{a.Alumno}</strong>
                  <span>{a.Motivo}</span>
                  <small>{a.Ultimos_estados}</small>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>Préstamos abiertos</h2>
              {openLoans.length === 0 && <p className="muted">No hay préstamos abiertos.</p>}
              {openLoans.map(l => (
                <div className="loanItem" key={l.ID_PRESTAMO}>
                  <div>
                    <strong>{l.Alumno}</strong>
                    <span>{l.Material}</span>
                    <small>{l.Fecha_Prestamo}</small>
                  </div>
                  <button onClick={() => handleReturnLoan(l)}>Devolver</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && view === 'lista' && (
        <section className="card">
          <div className="formRow">
            <label>
              Fecha
              <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
            </label>
            <label>
              Grupo
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                {groups.map(g => <option key={g}>{g}</option>)}
              </select>
            </label>
            <button onClick={saveGroupAttendance}>Guardar lista</button>
          </div>

          <div className="studentGrid">
            {groupStudents.map(s => {
              const current = attendanceState[s.ID_ALUMNO] || 'Presente';

              return (
                <div className="studentCard" key={s.ID_ALUMNO}>
                  <strong>{s.Alumno}</strong>
                  <small>{s.Usuario}</small>
                  <div className="states">
                    {['Presente', 'Ausente', 'Justificada', 'Tarde'].map(st => (
                      <button
                        key={st}
                        className={current === st ? 'selected' : ''}
                        onClick={() => markAttendance(s.ID_ALUMNO, st)}
                      >
                        {st[0]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Comentario del día..."
                    value={attendanceComment[s.ID_ALUMNO] || ''}
                    onChange={e => setAttendanceComment(prev => ({ ...prev, [s.ID_ALUMNO]: e.target.value }))}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!loading && view === 'alumno' && (
        <section className="grid studentLayout">
          <div className="card">
            <h2><Search size={18} /> Buscar alumno</h2>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre, usuario, grupo..." />
            <div className="resultList">
              {filteredStudents.slice(0, 80).map(s => (
                <button key={s.ID_ALUMNO} onClick={() => openStudent(s)}>
                  <strong>{s.Alumno}</strong>
                  <span>{s.Grupo}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            {!profile && <p className="muted">Seleccioná un alumno para ver la ficha.</p>}

            {profile && (
              <>
                <h2>{profile.alumno.Alumno}</h2>
                <div className="infoGrid">
                  <span>Usuario</span><strong>{profile.alumno.Usuario}</strong>
                  <span>TUMO ID</span><strong>{profile.alumno.TUMO_ID}</strong>
                  <span>Grupo</span><strong>{profile.alumno.Grupo}</strong>
                  <span>Tutor TUMO</span><strong>{profile.alumno.Tutor_TUMO}</strong>
                  <span>Contacto familia</span><strong>{profile.contacto?.Nombre_Tutor} {profile.contacto?.Apellido_Tutor}</strong>
                  <span>Teléfono tutor</span><strong>{profile.contacto?.Telefono_Tutor}</strong>
                  <span>Mail tutor</span><strong>{profile.contacto?.Mail_Tutor}</strong>
                </div>

                <h3>Asistencia rápida</h3>
                <div className="actionGrid">
                  {['Presente', 'Ausente', 'Justificada', 'Tarde'].map(st => (
                    <button key={st} onClick={() => saveSingleAttendance(st)}>{st}</button>
                  ))}
                </div>

                <button className="secondary" onClick={copyFamilyMessage}>Copiar mensaje para familia</button>

                <h3>Agregar comentario</h3>
                <div className="formRow">
                  <select value={commentForm.tipo} onChange={e => setCommentForm({ ...commentForm, tipo: e.target.value })}>
                    <option>General</option>
                    <option>Asistencia</option>
                    <option>Conducta</option>
                    <option>Proceso de aprendizaje</option>
                    <option>Comunicación con familia</option>
                    <option>Bienestar</option>
                  </select>
                </div>
                <textarea rows="3" placeholder="Comentario..." value={commentForm.comentario} onChange={e => setCommentForm({ ...commentForm, comentario: e.target.value })} />
                <textarea rows="2" placeholder="Próxima acción..." value={commentForm.proximaAccion} onChange={e => setCommentForm({ ...commentForm, proximaAccion: e.target.value })} />
                <button onClick={handleSaveComment}>Guardar comentario</button>

                <h3>Registrar incidencia</h3>
                <input placeholder="Tipo de incidencia" value={incidentForm.tipo} onChange={e => setIncidentForm({ ...incidentForm, tipo: e.target.value })} />
                <textarea rows="2" placeholder="Descripción..." value={incidentForm.descripcion} onChange={e => setIncidentForm({ ...incidentForm, descripcion: e.target.value })} />
                <button onClick={handleSaveIncident}>Guardar incidencia</button>

                <h3>Préstamo rápido</h3>
                <select value={loanForm.idMaterial} onChange={e => setLoanForm({ ...loanForm, idMaterial: e.target.value })}>
                  <option value="">Seleccionar material disponible...</option>
                  {availableMaterials.map(m => (
                    <option key={m.ID_MATERIAL} value={m.ID_MATERIAL}>{m.Tipo} · {m.Codigo}</option>
                  ))}
                </select>
                <input placeholder="Observaciones" value={loanForm.observaciones} onChange={e => setLoanForm({ ...loanForm, observaciones: e.target.value })} />
                <button onClick={handleCreateLoan}>Registrar préstamo</button>

                <h3>Préstamos abiertos del alumno</h3>
                {profile.prestamosAbiertos?.length === 0 && <p className="muted">Sin préstamos abiertos.</p>}
                {profile.prestamosAbiertos?.map(l => (
                  <div className="loanItem" key={l.ID_PRESTAMO}>
                    <div>
                      <strong>{l.Material}</strong>
                      <small>{l.Fecha_Prestamo}</small>
                    </div>
                    <button onClick={() => handleReturnLoan(l)}>Devolver</button>
                  </div>
                ))}

                <h3>Últimos comentarios</h3>
                {profile.comentarios?.map(c => (
                  <div className="historyItem" key={c.ID_COMENTARIO}>
                    <strong>{c.Fecha} · {c.Tipo}</strong>
                    <p>{c.Comentario}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {!loading && view === 'infodesk' && (
        <section className="grid two">
          <div className="card">
            <h2><Headphones size={18}/> Materiales</h2>
            <div className="formRow">
              <select value={materialForm.Tipo} onChange={e => setMaterialForm({ ...materialForm, Tipo: e.target.value })}>
                <option>Auricular</option>
                <option>Mouse</option>
                <option>Cargador</option>
                <option>Otro</option>
              </select>
              <input placeholder="Código" value={materialForm.Codigo} onChange={e => setMaterialForm({ ...materialForm, Codigo: e.target.value })} />
            </div>
            <input placeholder="Observaciones" value={materialForm.Observaciones} onChange={e => setMaterialForm({ ...materialForm, Observaciones: e.target.value })} />
            <button onClick={handleSaveMaterial}>Agregar material</button>

            <div className="materialList">
              {materials.map(m => (
                <div key={m.ID_MATERIAL} className="materialItem">
                  <strong>{m.Tipo} · {m.Codigo}</strong>
                  <span className={`pill ${String(m.Estado).toLowerCase()}`}>{m.Estado}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2><ClipboardList size={18}/> Préstamos abiertos</h2>
            {openLoans.map(l => (
              <div className="loanItem" key={l.ID_PRESTAMO}>
                <div>
                  <strong>{l.Alumno}</strong>
                  <span>{l.Material}</span>
                  <small>{l.Fecha_Prestamo}</small>
                </div>
                <button onClick={() => handleReturnLoan(l)}>Devolver</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ icon, label, value }) {
  return (
    <div className="kpi">
      <div className="kpiIcon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}