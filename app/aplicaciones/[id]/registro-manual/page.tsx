import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Notice, PageHeader, StatusPill } from "@/components/Ui";
import { all, one } from "@/db";
import { canViewIndividual, hasOrganizationAccess, requireAuthorizedUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { ROLE_LEVELS } from "@/lib/instruments";
import { issueCsrf } from "@/lib/security";
import { V3_COUNTS, answeredCount, answeredItemCount, applicableIntralaboralItems, parseRecord } from "@/lib/v3";

export const dynamic = "force-dynamic";

type Application = { id: string; name: string; organization_id: string; organization_name: string; status: string };
type Evaluation = {
  id: string;
  participant_code: string;
  instrument_form: "A" | "B";
  status: string;
  sociodemographic_json: string;
  intralaboral_answers_json: string;
  extralaboral_answers_json: string;
  stress_answers_json: string;
  serves_customers: number | null;
  supervises_people: number;
  updated_at: string;
  completed_at: string | null;
};

export default async function ManualEvaluationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; completed?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireAuthorizedUser(`/aplicaciones/${id}/registro-manual`);
  if (!canViewIndividual(user)) redirect("/acceso-denegado");
  const application = await one<Application>(
    `SELECT campaigns.id,campaigns.name,campaigns.organization_id,campaigns.status,organizations.name AS organization_name
     FROM campaigns JOIN organizations ON organizations.id=campaigns.organization_id WHERE campaigns.id=?`,
    id,
  );
  if (!application || !hasOrganizationAccess(user, application.organization_id)) notFound();
  const evaluations = await all<Evaluation>(
    `SELECT id,participant_code,instrument_form,status,sociodemographic_json,
      intralaboral_answers_json,extralaboral_answers_json,stress_answers_json,
      serves_customers,supervises_people,
      updated_at,completed_at
     FROM manual_evaluations WHERE campaign_id=? ORDER BY updated_at DESC`,
    id,
  );
  const csrf = await issueCsrf(user.email, `manual-evaluation:create:${id}`);

  return (
    <AppShell user={user}>
      <PageHeader
        eyebrow={`${application.organization_name} · ${application.name}`}
        title="Registro manual V3"
        description="Transcribe la ficha general y las respuestas de los cuatro instrumentos con control de completitud."
        action={<Link className="button button-secondary" href={`/aplicaciones/${id}`}>Volver a la aplicación</Link>}
      />
      {query.completed && <Notice tone="success">Evaluación manual finalizada y bloqueada para preservar su trazabilidad.</Notice>}
      {query.error && <Notice tone="danger">{query.error}</Notice>}
      <Notice>
        La captura utiliza los números de ítem y las escalas del Aplicativo V3. Transcribe únicamente desde los formatos oficiales; los enunciados no se reproducen en esta pantalla.
      </Notice>

      <section className="v3-flow-strip" aria-label="Contenido de una evaluación manual">
        <div><span>01</span><strong>Datos generales</strong><small>Ficha sociodemográfica y ocupacional</small></div>
        <div><span>02</span><strong>Intralaboral A o B</strong><small>{V3_COUNTS.intralaboralA} o {V3_COUNTS.intralaboralB} respuestas</small></div>
        <div><span>03</span><strong>Extralaboral</strong><small>{V3_COUNTS.extralaboral} respuestas</small></div>
        <div><span>04</span><strong>Estrés</strong><small>{V3_COUNTS.stress} respuestas</small></div>
      </section>

      <div className="content-grid manual-list-grid">
        <section className="card">
          <div className="card-header"><div><h2>Evaluaciones capturadas</h2><p>{evaluations.length} registro(s) manual(es)</p></div></div>
          {evaluations.length ? (
            <div className="table-wrap">
              <table className="manual-list-table">
                <thead><tr><th>Respondiente</th><th>Forma</th><th>Progreso</th><th>Estado</th><th>Actualización</th><th /></tr></thead>
                <tbody>
                  {evaluations.map((evaluation) => {
                    const socio = parseRecord(evaluation.sociodemographic_json);
                    const applicableItems = applicableIntralaboralItems({
                      form: evaluation.instrument_form,
                      servesCustomers: evaluation.serves_customers === 1,
                      supervisesPeople: Boolean(evaluation.supervises_people),
                    });
                    const answered = answeredItemCount(parseRecord(evaluation.intralaboral_answers_json), applicableItems) + answeredCount(parseRecord(evaluation.extralaboral_answers_json), V3_COUNTS.extralaboral) + answeredCount(parseRecord(evaluation.stress_answers_json), V3_COUNTS.stress);
                    const expected = applicableItems.length + V3_COUNTS.extralaboral + V3_COUNTS.stress;
                    const progress = Math.round((answered / expected) * 100);
                    return (
                      <tr key={evaluation.id}>
                        <td><span className="cell-stack"><strong>{evaluation.participant_code}</strong><small>{socio.fullName || "Datos generales pendientes"}</small></span></td>
                        <td><span className="form-badge">{evaluation.instrument_form}</span></td>
                        <td><span className="cell-stack numeric"><strong>{progress}%</strong><span className="progress-track"><span style={{ width: `${progress}%` }} /></span><small>{answered} de {expected} respuestas</small></span></td>
                        <td><StatusPill value={evaluation.status} /></td>
                        <td>{formatDateTime(evaluation.completed_at || evaluation.updated_at)}</td>
                        <td><Link className="table-link" href={`/aplicaciones/${id}/registro-manual/${evaluation.id}?paso=${evaluation.status === "completed" ? "revision" : "datos"}`}>{evaluation.status === "completed" ? "Ver control" : "Continuar"}</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Aún no hay capturas" text="Crea el primer registro con un código único y el nivel ocupacional correcto." />
          )}
        </section>

        <aside>
          <section className="card" id="nueva">
            <div className="card-header"><div><h2>Nueva evaluación</h2><p>Define el ID y la Forma</p></div></div>
            <div className="card-body">
              {application.status === "closed" ? (
                <Notice tone="warning">La aplicación está cerrada. Reactívala para crear registros.</Notice>
              ) : (
                <form className="form-grid" action="/api/admin/manual-evaluations" method="post">
                  <input type="hidden" name="csrf" value={csrf} />
                  <input type="hidden" name="applicationId" value={id} />
                  <div className="field field-full"><label htmlFor="manual-code">ID del respondiente *</label><input id="manual-code" name="participantCode" required maxLength={40} placeholder="P-001" autoComplete="off" /><small>Debe ser único dentro de esta aplicación.</small></div>
                  <div className="field field-full"><label htmlFor="manual-role">Tipo de cargo *</label><select id="manual-role" name="roleLevel" required>{ROLE_LEVELS.map((role) => <option key={role.value} value={role.value}>{role.label} · Forma {role.form}</option>)}</select><small>El nivel ocupacional determina automáticamente la Forma A o B.</small></div>
                  <div className="form-actions"><button className="button button-primary button-block" type="submit">Iniciar captura V3</button></div>
                </form>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
