import { useEffect } from "react";

export const useBeforeUnload = (canvas) => {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (canvas && canvas.getObjects().length > 0) {
        e.returnValue = true;
        return true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [canvas]);
};