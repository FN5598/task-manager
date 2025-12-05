import { HeaderComponent } from "../components/HeaderComponent";
import { NavLink } from "react-router-dom";

export function HomePage() {


    return (
        <div>
            <HeaderComponent />

            <div className="h-screen bg-bg text-text">

                <NavLink to="/canvas">link to canvas</NavLink>
            </div>
        </div>
    );
}