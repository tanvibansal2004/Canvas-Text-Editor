import { useEffect, useRef, useState } from "react";

export const useFabricCanvas = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [activeObject, setActiveObject] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  // Load Fabric.js dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
    script.async = true;
    script.onload = () => {
      setFabricLoaded(true);
    };
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize canvas
  const initializeCanvas = (onObjectSelected, onObjectCleared, onCanvasModified) => {
    if (fabricLoaded && canvasRef.current && !canvas) {
      const containerEl = canvasRef.current.parentElement;
      const containerWidth = containerEl.clientWidth;
      const containerHeight = Math.min(450, window.innerHeight * 0.75);
      
      const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: "#ffffff"
      });
      
      setCanvas(fabricCanvas);

      // Set up event listeners
      fabricCanvas.on('selection:created', onObjectSelected);
      fabricCanvas.on('selection:updated', onObjectSelected);
      fabricCanvas.on('selection:cleared', onObjectCleared);
      fabricCanvas.on('object:modified', onCanvasModified);
      fabricCanvas.on('object:added', onCanvasModified);
      fabricCanvas.on('object:removed', onCanvasModified);
      
      return fabricCanvas;
    }
    return null;
  };

  // Handle canvas resize
  const handleCanvasResize = (history, historyIndex, isPerformingUndoRedo, setHistory, setHistoryIndex) => {
    if (!canvas) return;
    
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const containerEl = canvasRef.current?.parentElement;
        if (!containerEl) return;
        
        const newWidth = containerEl.clientWidth;
        const newHeight = Math.min(450, window.innerHeight * 0.75);
        const currentWidth = canvas.getWidth();
        const currentHeight = canvas.getHeight();
        
        if (Math.abs(newWidth - currentWidth) < 5 && Math.abs(newHeight - currentHeight) < 5) {
          return;
        }
        
        setIsResizing(true);
        
        const scaleX = newWidth / currentWidth;
        const scaleY = newHeight / currentHeight;
        
        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);

        const objects = canvas.getObjects();
        objects.forEach(obj => {
          obj.scaleX = (obj.scaleX || 1) * scaleX;
          obj.scaleY = (obj.scaleY || 1) * scaleY;
          obj.left = (obj.left || 0) * scaleX;
          obj.top = (obj.top || 0) * scaleY;
          obj.setCoords();
        });
        
        canvas.renderAll();
        
        if (!isPerformingUndoRedo && historyIndex >= 0) {
          const newHistory = [...history];
          newHistory[historyIndex] = canvas.toJSON();
          setHistory(newHistory);
        }
        
        setIsResizing(false);
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  };

  return {
    canvasRef,
    canvas,
    fabricLoaded,
    activeObject,
    setActiveObject,
    isResizing,
    initializeCanvas,
    handleCanvasResize
  };
};