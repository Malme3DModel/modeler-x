"use client";

import Dropdown from "@/components/commons/Dropdown";
import Table from "@/components/commons/Table";
import { datetimeFormat } from "@/utils/DatetimeFormat";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import CreateAccountModel from "./CreateAccountModel";
import EditAccountModel from "./EditAccountModel";

type Props = {
  accounts: Account[];
};

const headers = [
  "会社名",
  "契約者名",
  "メールアドレス",
  "電話番号",
  "作成日",
  "",
];

export default function AdminAccountsComponetPage(props: Readonly<Props>) {
  const router = useRouter();
  const [editAccount, setEditAccount] = useState<Account>();

  const createAccountButtonClick = () => {
    if (document) {
      (
        document.getElementById("create_account") as HTMLFormElement
      ).showModal();
    }
  };

  const EditAccountButtonClick = (account: Account) => {
    setEditAccount(account);
    if (document) {
      (document.getElementById("edit_account") as HTMLFormElement).showModal();
    }
  };

  const tableData = props.accounts.map((account) => {
    const dropdownItems = [
      <button
        key={account.organization_uuid}
        onClick={() => EditAccountButtonClick(account)}
      >
        編集
      </button>,
    ];

    return [
      account.organization_name,
      account.user_name,
      account.user_email,
      account.user_phone,
      datetimeFormat(account.created_at),
      <Dropdown key={account.organization_uuid} items={dropdownItems} />,
    ];
  });

  const onSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    router.push(`/admin/accounts?search=${formData.get("search")}`);
    router.refresh();
  };

  return (
    <>
      <div className="w-full flex items-center justify-between">
        <div className="font-bold text-lg">契約アカウント</div>
        <div className="flex gap-2 items-center">
          <form onSubmit={onSearchSubmit}>
            <label className="input input-bordered rounded-md flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                name="search"
                className="grow"
                placeholder="検索"
              />
            </label>
          </form>
          <button
            onClick={createAccountButtonClick}
            className="btn btn-primary rounded-md"
          >
            アカウント作成
          </button>
        </div>
      </div>

      <div className="mt-8">
        <Table headers={headers} data={tableData} />
      </div>

      <CreateAccountModel />
      <EditAccountModel account={editAccount} />
    </>
  );
}
