import FormInput from "@/components/forms/Input";
import SubmitButton from "@/components/forms/SubmitButton";
import { apiPost } from "@/utils/api";

export default async function Account() {
  const handleAction = async (formData: FormData) => {
    "use server";
    const res = await apiPost("/me/change_password", {
      current_password: formData.get("current_password"),
      new_password: formData.get("new_password"),
      confirm_password: formData.get("confirm_password"),
    });
  };

  return (
    <>
      <div className="text-xl mb-10">Account</div>

      <div className="w-full">
        <div className="bg-gray-200 rounded p-4">
          <div className="text-lg mb-2">パスワード変更</div>
          <div>
            <form className="space-y-4 w-1/2" action={handleAction}>
              <FormInput
                label="現在のパスワード"
                type="password"
                name="current_password"
                className="w-full"
              />
              <FormInput
                label="新しいパスワード"
                type="password"
                name="new_password"
                className="w-full"
              />
              <FormInput
                label="新しいパスワード（確認）"
                type="password"
                name="confirm_password"
                className="w-full"
              />
              <SubmitButton text="変更" />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
