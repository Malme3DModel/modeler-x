import { signIn } from "@/auth";

const REDIRET_PATH = process.env.NEXT_PUBLIC_LOGIN_REDIRECT_PATH ?? "/home";

export default function LoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
    >
      <button className="btn" type="submit">
        ログイン
      </button>
    </form>
  );
}
