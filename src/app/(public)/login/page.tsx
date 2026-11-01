import { isRegistrationOpen } from "@/app/(public)/register/actions";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";


export default async function LoginPage() {
  const open = await isRegistrationOpen();

  return (
    <div className="flex w-full items-center justify-center p-4">
      <LoginForm registrationOpen={open} />
    </div>
  );
}
