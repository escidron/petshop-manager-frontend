import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import ToastProvider from "./components/Toast/ToastProvider";
import { AuthProvider } from "./features/users/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
