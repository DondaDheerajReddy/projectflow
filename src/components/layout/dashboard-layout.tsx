import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  workspaceId: string;
  navTitle?: string;
}

export default function DashboardLayout({
  children,
  workspaceId,
  navTitle,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaceId={workspaceId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title={navTitle} workspaceId={workspaceId} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}