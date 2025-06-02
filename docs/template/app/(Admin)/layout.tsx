import NotFound404 from "@/components/pages/NotFound404";
import { apiGet } from "@/utils/api";

export default async function AuthedRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me: Me = await apiGet("/me");

  if (!me.is_admin) {
    return <NotFound404 />;
  }

  return (
    <div className="flex h-screen">
      <div className="p-5 w-full">{children}</div>
    </div>
  );
}
