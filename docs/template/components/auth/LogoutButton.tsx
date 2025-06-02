import { signOut } from "@/auth";

const LOGIN_PATH = process.env.NEXT_PUBLIC_LOGIN_PATH;

export default function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: LOGIN_PATH });
      }}
    >
      <button className="btn btn-sm rounded btn-link" type="submit">ログアウト</button>
    </form>
  );
}
