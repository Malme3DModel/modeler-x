import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <div className="text-xl mb-10">Wellcom!!</div>
      <div>{session?.user?.name}</div>
      <div>{session?.user?.id}</div>
    </>
  );
}
