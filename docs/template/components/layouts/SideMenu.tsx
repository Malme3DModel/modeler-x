import { apiGet } from "@/utils/api";
import LogoutButton from "../auth/LogoutButton";

export default async function SideMenu() {
  const menu_items = [
    {
      title: "Home",
      href: "/home",
    },
    {
      title: "Account",
      href: "/account",
    },
  ];

  const me: Me = await apiGet("/me");

  if (me.is_admin) {
    menu_items.push({
      title: "契約アカウント",
      href: "/admin/accounts",
    });
  }

  return (
    <div className="flex flex-col min-h-screen justify-between border-r-2">
      <div>
        <ul className="menu rounded-box">
          {menu_items.map((item) => (
            <li key={item.title}>
              <a href={item.href} className="menu-item" aria-current="page">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-3">
        <h1 className="mb-2 ml-4 text-sm">User: {me.name}</h1>
        <LogoutButton />
      </div>
    </div>
  );
}
