import SideMenu from "@/components/layouts/SideMenu";

export default async function AuthedRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen">
      <div className="min-w-44">
        <SideMenu />
      </div>
      <div className="p-5 w-full">{children}</div>
    </div>
  );
}
