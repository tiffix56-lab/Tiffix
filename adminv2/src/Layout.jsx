import { Link, Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex w-screen h-screen ">
      {/* Sidebar */}
      <aside className="w-64  p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">Tiffix</h2>
        
        <nav className="flex flex-col gap-2">
          <Link 
            to="/" 
            className="px-3 py-2 rounded hover:bg-gray-200 transition"
          >
            Dashboard
          </Link>
          <Link 
            to="/about" 
            className="px-3 py-2 rounded hover:bg-gray-200 transition"
          >
            Provider Management
          </Link>
          <Link 
            to="/menu" 
            className="px-3 py-2 rounded hover:bg-gray-200 transition"
          >
            Menu
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
