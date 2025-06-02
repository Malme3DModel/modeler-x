"use client";

import FormInput from "@/components/forms/Input";
import SubmitButton from "@/components/forms/SubmitButton";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";

type Props = {
  account: Account | undefined;
};

export default function EditAccountModel(props: Readonly<Props>) {
  const router = useRouter();

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("organization_uuid", props.account?.organization_uuid as string);
    formData.set("user_uuid", props.account?.user_uuid as string);
    const res = await fetch("/api/admin/accounts", {
      method: "PATCH",
      body: formData,
    });

    if (!res.ok) {
      alert("アカウント編集に失敗しました");
      return;
    }

    if (document) {
      const modal = document.getElementById("edit_account") as HTMLFormElement;
      modal.close();
    }

    router.refresh();
  };

  return (
    <dialog id="edit_account" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg text-center">アカウント編集</h3>
        <div className="modal-action w-full">
          <form className="w-full" onSubmit={onCreateSubmit}>
            <FormInput
              label="会社名"
              type="text"
              name="organization_name"
              value={props.account?.organization_name}
              placeholder="会社名を入力してください"
              required={true}
              className="w-full"
            />
            <FormInput
              label="契約者名"
              type="text"
              name="user_name"
              value={props.account?.user_name}
              placeholder="契約者名を入力してください"
              required={true}
              className="w-full"
            />
            <FormInput
              label="電話番号（ハイフンなし）"
              type="text"
              name="user_phone"
              value={props.account?.user_phone}
              placeholder="電話番号を入力してください"
              className="w-full"
            />
            <div className="mt-6 text-center">
              <SubmitButton text="保存" className="w-28" />
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}
