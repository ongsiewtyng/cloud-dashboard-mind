
import { useState } from "react";
import { Menu, X, LayoutDashboard, Server } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Machine Conditions",
      path: "/machine-conditions",
      icon: <Server className="h-5 w-5" />,
    },
  ];

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50"
        onClick={toggleSidebar}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-40",
          isOpen ? "transform-none" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-center h-16 border-b">
            <h1 className="text-xl font-semibold">Machine Monitor</h1>
          </div>
          
          <nav className="mt-6 flex-1">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-md hover:bg-slate-100 transition-colors",
                      location.pathname === item.path && "bg-slate-100 font-medium"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setIsOpen(false);
                      }
                    }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">© 2023 Machine Monitor</p>
          </div>
        </div>
      </div>
      
      {/* Overlay to close sidebar when clicked outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
