import { useEffect } from "react";
import { hydrateFromStorage } from "../store/Currencystore";


export function CurrencyBootstrap() {
  useEffect(() => {
    hydrateFromStorage();
  }, []);

  return null;
}

export default CurrencyBootstrap;