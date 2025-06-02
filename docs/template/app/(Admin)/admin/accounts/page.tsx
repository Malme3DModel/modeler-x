import AdminAccountsComponetPage from "@/components/pages/admin/AdminAccountsComponetPage";
import { apiGet } from "@/utils/api";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: { search: string };
}) {
  let accounts: Account[] = [];
  if (searchParams.search) {
    accounts = await apiGet(`/admin/accounts?search=${searchParams.search}`);
  } else {
    accounts = await apiGet("/admin/accounts");
  }

  return <AdminAccountsComponetPage accounts={accounts} />;
}
