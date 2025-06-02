import { signIn } from "@/auth";
import FormInput from "@/components/forms/Input";
import SubmitButton from "@/components/forms/SubmitButton";

const REDIRET_PATH = process.env.NEXT_PUBLIC_LOGIN_REDIRECT_PATH as string;

export default async function Login() {
  const handleAction = async (formData: FormData) => {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: REDIRET_PATH,
    });
  };

  return (
    <div className="relative flex flex-col justify-center h-screen overflow-hidden">
      <div className="w-full p-6 m-auto bg-white rounded-md ring-1 ring-gray-800/50 lg:max-w-lg">
        <h1 className="text-3xl font-semibold text-center text-gray-700">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <form className="space-y-4" action={handleAction}>
          <FormInput
            label="メールアドレス"
            type="email"
            name="email"
            className="w-full"
          />
          <FormInput
            label="パスワード"
            type="password"
            name="password"
            className="w-full"
          />
          <SubmitButton text="ログイン" />
        </form>
      </div>
    </div>
  );
}
