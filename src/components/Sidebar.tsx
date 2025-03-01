import {useState} from "react";
import {LayoutDashboard, Server, Menu} from "lucide-react";
import {Link, useLocation} from "react-router-dom";
import {cn} from "@/lib/utils";

export function Sidebar() {
    const [isHovered, setIsHovered] = useState(false);
    const location = useLocation();

    const navItems = [
        {
            name: "Dashboard",
            path: "/",
            icon: <LayoutDashboard className="h-5 w-5"/>,
        },
        {
            name: "Machine Conditions",
            path: "/machine-conditions",
            icon: <Server className="h-5 w-5"/>,
        },
    ];

    return (
        <div
            className={cn(
                "fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-40",
                isHovered ? "w-64" : "w-16"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex flex-col h-full p-4">
                {/* Logo / Title */}
                <div className="flex items-center justify-center h-16 border-b">
                    {isHovered ? (
                        <h1 className="text-xl font-semibold">Machine Monitor</h1>
                    ) : (
                        <span className="text-xl font-semibold"><Menu/></span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="mt-6 flex-1">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={cn(
                                        "flex items-center px-4 py-3 rounded-md hover:bg-slate-100 transition-colors",
                                        isHovered ? "gap-3 justify-start" : "justify-center",
                                        location.pathname === item.path && "bg-slate-100 font-medium",
                                    )}
                                >
                                    <span className="text-black">{item.icon}</span>
                                    {isHovered && <span>{item.name}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                {isHovered && (
                    <div className="border-t pt-4">
                        <p className="text-xs text-gray-500 text-center">
                            © {new Date().getFullYear()} Machine Monitor
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
