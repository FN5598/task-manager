import { HeaderComponent } from "../components/HeaderComponent";
import { useNavigate } from "react-router-dom";

export function HomePage() {
    const navigate = useNavigate();

    function navigateTask(taskId: string) {
        navigate(`/tasks/${taskId}`);
    }
    
    return (
        <div>
            <HeaderComponent />

            <div className="h-screen bg-bg text-text">
                <h1>All Tasks</h1>
                <div 
                className="flex flex-col border-border-color border items-center max-w-40 h-auto"
                onClick={() => navigateTask}>
                    <h1 className="flex">Task 1</h1>
                    <p className="text-text-muted">descrition</p>
                </div>
            </div>
        </div>
    );
}