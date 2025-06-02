"use client";

import FormInput from "@/components/forms/Input";
import SubmitButton from "@/components/forms/SubmitButton";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function CreateAccountModel() {
  const router = useRouter();

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("アカウント作成に失敗しました");
      return;
    }

    if (document) {
      const modal = document.getElementById("create_account") as HTMLFormElement;
      modal.close();
    }

    router.refresh();
  };

  return (
    <dialog id="create_account" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg text-center">アカウント作成</h3>
        <div className="modal-action w-full">
          <form className="w-full" onSubmit={onCreateSubmit}>
            <FormInput
              label="会社名"
              type="text"
              name="organization_name"
              placeholder="会社名を入力してください"
              required={true}
              className="w-full"
            />
            <FormInput
              label="契約者名"
              type="text"
              name="user_name"
              placeholder="契約者名を入力してください"
              required={true}
              className="w-full"
            />
            <FormInput
              label="メールアドレス（ID）"
              type="email"
              name="user_email"
              placeholder="メールアドレスを入力してください"
              required={true}
              className="w-full"
            />
            <FormInput
              label="電話番号（ハイフンなし）"
              type="text"
              name="user_phone"
              placeholder="電話番号を入力してください"
              className="w-full"
            />
            <div className="mt-6 text-center">
              <SubmitButton text="作成" className="w-28" />
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}
