import { useEffect } from "react";
import { useFabricCanvas } from "./hooks/useFabricCanvas";
import { useCanvasHistory } from "./hooks/useCanvasHistory";
import { useTextFormatting } from "./hooks/useTextFormatting";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useBeforeUnload } from "./hooks/useBeforeUnload";
import Header from "./components/Header";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import { createTextObject, updateTextFormatting } from "./utils/textOperations";
import logo from './assets/celebrareLogo.png';

export default function TextEditorApp() {
  const {
    canvasRef,
    canvas,
    fabricLoaded,
    activeObject,
    setActiveObject,
    isResizing,
    initializeCanvas,
    handleCanvasResize
  } = useFabricCanvas();

  const {
    history,
    historyIndex,
    isPerformingUndoRedo,
    saveCanvasToHistory,
    handleUndo,
    handleRedo
  } = useCanvasHistory();

  const {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    isBold,
    setIsBold,
    isItalic,
    setIsItalic,
    isUnderline,
    setIsUnderline,
    textColor,
    setTextColor,
    updateFromObject,
    resetToDefaults
  } = useTextFormatting();

  // Object selection handlers
  const handleObjectSelected = (e) => {
    if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') {
      const text = e.selected[0];
      setActiveObject(text);
      updateFromObject(text);
    }
  };

  const handleObjectCleared = () => {
    setActiveObject(null);
  };

  // Save to history with debouncing
  const saveToHistory = () => {
    if (isPerformingUndoRedo || isResizing) return;
    
    setTimeout(() => {
      if (canvas && !isPerformingUndoRedo && !isResizing) {
        saveCanvasToHistory(canvas);
      }
    }, 0);
  };

  // Update UI state based on active object
  const updateUIState = (activeObj) => {
    if (activeObj && activeObj.type === 'i-text') {
      setActiveObject(activeObj);
      updateFromObject(activeObj);
    } else {
      setActiveObject(null);
      resetToDefaults();
    }
  };

  // Canvas operations
  const addText = () => {
    if (!canvas) return;
    
    const textOptions = {
      fontSize,
      fontFamily,
      textColor,
      isBold,
      isItalic,
      isUnderline
    };
    
    const text = createTextObject(canvas, textOptions);
    setActiveObject(text);
  };

  const handleFormatUpdate = (property, value) => {
    updateTextFormatting(activeObject, canvas, property, value);
    saveToHistory();
  };

  // Font size handlers
  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    handleFormatUpdate("fontSize", newSize);
  };

  const handleBoldToggle = () => {
    const newValue = !isBold;
    setIsBold(newValue);
    handleFormatUpdate("fontWeight", newValue ? 'bold' : 'normal');
  };

  const handleItalicToggle = () => {
    const newValue = !isItalic;
    setIsItalic(newValue);
    handleFormatUpdate("fontStyle", newValue ? 'italic' : 'normal');
  };

  const handleUnderlineToggle = () => {
    const newValue = !isUnderline;
    setIsUnderline(newValue);
    handleFormatUpdate("underline", newValue);
  };

  // History handlers
  const onUndo = () => handleUndo(canvas, updateUIState);
  const onRedo = () => handleRedo(canvas, updateUIState);

  // Initialize canvas
  useEffect(() => {
    const fabricCanvas = initializeCanvas(handleObjectSelected, handleObjectCleared, saveToHistory);
    if (fabricCanvas) {
      saveCanvasToHistory(fabricCanvas);
    }
  }, [fabricLoaded]);

  // Setup canvas resize handler
  useEffect(() => {
    if (canvas) {
      return handleCanvasResize(history, historyIndex, isPerformingUndoRedo, () => {}, () => {});
    }
  }, [canvas, history, historyIndex, isPerformingUndoRedo]);

  // Setup keyboard shortcuts and before unload warning
  useKeyboardShortcuts(onUndo, onRedo);
  useBeforeUnload(canvas);

  if (!fabricLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-300">
      <Header 
        logo={logo}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      
      <Canvas canvasRef={canvasRef} />
      
      <Toolbar
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        isBold={isBold}
        onBoldToggle={handleBoldToggle}
        isItalic={isItalic}
        onItalicToggle={handleItalicToggle}
        isUnderline={isUnderline}
        onUnderlineToggle={handleUnderlineToggle}
        onAddText={addText}
        onFormatUpdate={handleFormatUpdate}
      />
    </div>
  );
}