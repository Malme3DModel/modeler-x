import { apiPatch, apiPost } from "@/utils/api";

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await apiPost("/admin/accounts", Object.fromEntries(formData));
  return Response.json(result, { status: 200 });
}


export async function PATCH(request: Request) {
  const formData = await request.formData();
  const url = `/admin/accounts/${formData.get('organization_uuid')}/${formData.get('user_uuid')}`;
  const result = await apiPatch(url, Object.fromEntries(formData));
  return Response.json(result, { status: 200 });
}
