import { redirect } from "next/navigation";

/** AZ настраивается инлайн в Академии (уроки / задание), отдельная страница не нужна */
export default function AdminAzRedirect() {
  redirect("/academy");
}
