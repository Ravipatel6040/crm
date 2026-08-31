import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { UIProvider } from "../../context/UIContext";

export default function DashboardLayout() {
  return (
    <UIProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </UIProvider>
  );
}
