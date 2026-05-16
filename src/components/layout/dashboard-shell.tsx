import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileTopBar } from "@/components/layout/mobile-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileTopBar />
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AppSidebar />
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-auto pb-20 md:pb-0"
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </>
  );
}
