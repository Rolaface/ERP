import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { PermissionBootstrap } from "./views/PermissionBootstrap";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PermissionBootstrap />  
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
