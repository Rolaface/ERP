import { useEffect, useRef } from "react";

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const barcodeBuffer = useRef<string>("");
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = Date.now();
      
      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = "";
      }

      lastKeyTime.current = currentTime;

      if (e.key === "Enter" && barcodeBuffer.current.length > 3) {
        e.preventDefault();
        onScan(barcodeBuffer.current);
        barcodeBuffer.current = ""; 
        return;
      }

      // Add alphanumeric characters to the buffer
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan]);
};