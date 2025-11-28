import { NavLink } from "react-router-dom";

export function HeaderComponent() {

    function changeTheme() {
        let currentTheme = '';
        const theme = document.documentElement.classList.toggle("light");
        if(theme == true) currentTheme = "light"
        localStorage.setItem("isLightTheme", currentTheme || "dark");
    }

    return (
        <nav className="flex flex-row justify-between pl-20 pr-20 bg-bg-dark text-text font-bangers font-bold p-4 items-center">
            <p>Task Manager</p>
            <div className="flex gap-20">
                <NavLink to='/'>Home Page</NavLink>
                <NavLink to='/login'>Login</NavLink>
            </div>
            <button
                className="cursor-pointer border-border-color border p-2 rounded-md bg-bg-light w-23"
                onClick={changeTheme}
            >
                Switch Theme
            </button>
        </nav>
    );
}