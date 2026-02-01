import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import ToastProvider from "./components/Toast/ToastProvider";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
