import { useState } from "react";

export const useCanvasHistory = () => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPerformingUndoRedo, setIsPerformingUndoRedo] = useState(false);

  const saveCanvasToHistory = (canvas) => {
    const jsonCanvas = canvas.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(jsonCanvas);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = (canvas, updateUIState) => {
    if (historyIndex > 0) {
      setIsPerformingUndoRedo(true);
      
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      canvas.clear();
      canvas.loadFromJSON(previousState, () => {
        canvas.renderAll();
        setHistoryIndex(newIndex);
        setIsPerformingUndoRedo(false);
        updateUIState(canvas.getActiveObject());
      });
    }
  };

  const handleRedo = (canvas, updateUIState) => {
    if (historyIndex < history.length - 1) {
      setIsPerformingUndoRedo(true);
      
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      canvas.clear();
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryIndex(newIndex);
        setIsPerformingUndoRedo(false);
        updateUIState(canvas.getActiveObject());
      });
    }
  };

  return {
    history,
    historyIndex,
    isPerformingUndoRedo,
    saveCanvasToHistory,
    handleUndo,
    handleRedo
  };
};