import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { PermissionBootstrap } from "./views/PermissionBootstrap";
import CompanyDefaultsBootstrap from "./views/CompanyDefaultsBootstrap";
import CurrencyBootstrap from "./views/Currencybootstrap";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PermissionBootstrap />
      <CompanyDefaultsBootstrap />
      <CurrencyBootstrap />
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;