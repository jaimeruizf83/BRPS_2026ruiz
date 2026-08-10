import { audit, one, run } from "@/db";
import { hasOrganizationAccess } from "@/lib/auth";
import { authenticatedForm, isResponse, redirectTo, textField } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const form=await request.formData(); const user=await authenticatedForm(request,form,"campaign:create"); if(isResponse(user)) return user;
    if(!["super_admin","psychologist","company_admin"].includes(user.role)) return new Response("Permiso insuficiente",{status:403});
    const name=textField(form,"name",{required:true,max:120}); const organizationId=textField(form,"organizationId",{required:true,max:60}); const startsOn=textField(form,"startsOn",{max:10}); const endsOn=textField(form,"endsOn",{max:10});
    if(startsOn&&endsOn&&endsOn<startsOn) throw new Error("La fecha de cierre no puede ser anterior al inicio");
    const organization=await one<{id:string}>("SELECT id FROM organizations WHERE id = ?",organizationId); if(!organization||!hasOrganizationAccess(user,organizationId)) return new Response("Organización no autorizada",{status:403});
    const id=crypto.randomUUID(); await run(`INSERT INTO campaigns (id, organization_id, name, description, status, starts_on, ends_on, created_by) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,id,organizationId,name,textField(form,"description",{max:500}),startsOn||null,endsOn||null,user.email);
    await audit(user.email,"campaign.created","campaign",id,{name,organizationId}); return redirectTo(request,`/campanas/${id}`,{created:"1"});
  } catch(error) { return redirectTo(request,"/campanas",{error:error instanceof Error?error.message:"No fue posible crear la campaña"}); }
}
