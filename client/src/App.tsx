import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { TaskPage } from './pages/TaskPage';
import { ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import { CanvasPage } from "./pages/CanvasPage";

function App() {


  useEffect(() => {
    const isLightTheme = localStorage.getItem("isLightTheme");
    if (isLightTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [])


  return (
    <>
      {/* Alert Pop Up */}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        limit={1}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />


      {/* All Routes */}
      <Routes>
        <Route index element={<HomePage />} />

        <Route path="/task/:id" element={<TaskPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignupPage />} />

        <Route path="/canvas" element={<CanvasPage />} />
      </Routes>
    </>
  );
}

export default App
