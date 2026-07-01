import { ParsuLogo } from "@/components/parsu-logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <ParsuLogo size={36} className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-bold text-primary leading-tight">
              ParSU NTP IPCR Evaluation Assistant
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              FY 2026 Non-Teaching Personnel Rating Computation
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white py-3 text-center text-xs text-muted-foreground">
        <p>Partido State University &mdash; Non-Teaching IPCR rating computation assistant</p>
        <p className="mt-0.5">Session data is not permanently stored</p>
      </footer>
    </div>
  );
}
