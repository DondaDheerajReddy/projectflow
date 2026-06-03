import { auth } from "@/lib/auth/auth";
import UserMenu from "./user-menu";
import NavbarActions from "./navbar-actions";

interface NavbarProps {
  title?: string;
  workspaceId?: string;
}

export default async function Navbar({ title, workspaceId }: NavbarProps) {
  const session = await auth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-sm font-semibold text-foreground">
        {title ?? "ProjectFlow"}
      </h1>
      <div className="flex items-center gap-3">
        {workspaceId && <NavbarActions workspaceId={workspaceId} />}
        <UserMenu
          name={session?.user?.name ?? ""}
          email={session?.user?.email ?? ""}
          image={session?.user?.image ?? ""}
        />
      </div>
    </header>
  );
}