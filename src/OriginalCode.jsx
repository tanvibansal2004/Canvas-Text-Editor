// DYNAMIC LOADING OF FABRIC.JS
import { useEffect, useRef, useState } from "react";
import { Undo2, Redo2, Plus, Minus, Bold, Italic, Underline, Type } from "lucide-react";
import logo from './assets/celebrareLogo.png'

export default function TextEditorApp() {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [activeObject, setActiveObject] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  
  // History tracking for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPerformingUndoRedo, setIsPerformingUndoRedo] = useState(false);

  // Dynamically load fabric.js at Run-Time
  useEffect(() => {
    // Load Fabric.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
    script.async = true;
    script.onload = () => {
      setFabricLoaded(true);
    };
    document.body.appendChild(script); // add to HTML document
    
    return () => {
      // when component unmounts, remove the script from the HTML document
      document.body.removeChild(script);
    };
  }, []);

  // Add beforeunload event listener to warn about losing progress
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if there's any content on the canvas (more than just the initial empty state)
      if (canvas && canvas.getObjects().length > 0) {
        // const message = "You have unsaved changes. If you reload the page, your canvas will be cleared and you will lose your progress.";
        e.returnValue = true; // For most browsers
        return true; // For some older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [canvas]);

  // Initialize canvas once Fabric.js is loaded
  // canvasRef.current is the actual canvas DOM Element.
  useEffect(() => {
    if (fabricLoaded && canvasRef.current && !canvas) {
      // Get the container element dimensions
      const containerEl = canvasRef.current.parentElement;
      const containerWidth = containerEl.clientWidth;
      const containerHeight = Math.min(450, window.innerHeight * 0.75); // Calculate height with a reasonable aspect ratio
      
      const fabricCanvas = new window.fabric.Canvas(canvasRef.current, {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: "#ffffff"
      });
      
      setCanvas(fabricCanvas);

      // Set up event listeners
      fabricCanvas.on('selection:created', handleObjectSelected); // selecting an element.
      fabricCanvas.on('selection:updated', handleObjectSelected); // changing the selection.
      fabricCanvas.on('selection:cleared', () => setActiveObject(null)); // nothing is selected.
      
      // Add event listeners for saving history states
      fabricCanvas.on('object:modified', saveToHistory); // user modifies an element/object.
      fabricCanvas.on('object:added', saveToHistory); // new element/object added to the canvas.
      fabricCanvas.on('object:removed', saveToHistory); // when an element/object is deleted.
      
      // Initialize history with empty canvas state
      saveCanvasToHistory(fabricCanvas);
      
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [fabricLoaded]);

  // Handle window resize for existing canvas
  useEffect(() => {
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
  }, [canvas, history, historyIndex, isPerformingUndoRedo]);
  
  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault(); // Stops the browser's default Ctrl+Z behavior
        handleUndo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);
  
  // Save current canvas state to history
  const saveToHistory = () => {
    // Skip if we're currently performing an undo/redo operation
    if (isPerformingUndoRedo || isResizing) return;
    
    setTimeout(() => {
      // saveCanvasToHistory(canvas);
      if (canvas && !isPerformingUndoRedo && !isResizing) {
        saveCanvasToHistory(canvas);
      }
    }, 0); // ensuring that save happens after the current operation is finished (in the next 'tick' of the event loop)
  };
  
  const saveCanvasToHistory = (canvas) => {
    // Create a JSON representation of the canvas
    const jsonCanvas = canvas.toJSON();
    
    // Truncate the history if we've gone back and then made changes
    const newHistory = history.slice(0, historyIndex + 1); // that is from index 0 to index historyIndex
    newHistory.push(jsonCanvas);

    // const maxHistorySize = 50;
    // if (newHistory.length > maxHistorySize) {
    //   newHistory.shift();
    //   setHistoryIndex(newHistory.length - 1);
    // } else {
    //   setHistoryIndex(newHistory.length - 1);
    // }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Handle object selection
  const handleObjectSelected = (e) => {
    if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') { //  Fabric.js uses 'i-text' for editable text objects
      const text = e.selected[0];
      setActiveObject(text);
      setFontSize(text.fontSize || 20);
      setFontFamily(text.fontFamily || "Arial");
      setTextColor(text.fill || "#000000");
      setIsBold(text.fontWeight === 'bold');
      setIsItalic(text.fontStyle === 'italic');
      setIsUnderline(text.underline || false);
    }
  };
  
  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) { // at least one PREVIOUS state should be there.
      setIsPerformingUndoRedo(true);
      
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      // Clear the canvas and load the previous state
      canvas.clear();
      canvas.loadFromJSON(previousState, () => { // loadFromJSON() restores the canvas from the saved JSON state | callback that runs after loading completes
        canvas.renderAll();
        setHistoryIndex(newIndex);
        setIsPerformingUndoRedo(false);
        
        // Update UI state based on selected object (if any)
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.type === 'i-text') {
          setActiveObject(activeObj);
          setFontSize(activeObj.fontSize || 20);
          setFontFamily(activeObj.fontFamily || "Arial");
          setTextColor(activeObj.fill || "#000000");
          setIsBold(activeObj.fontWeight === 'bold');
          setIsItalic(activeObj.fontStyle === 'italic');
          setIsUnderline(activeObj.underline || false);
        } else {
          setActiveObject(null);
        }
      });
    }
  };
  
  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsPerformingUndoRedo(true);
      
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      // Clear the canvas and load the next state
      canvas.clear();
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryIndex(newIndex);
        setIsPerformingUndoRedo(false);
        
        // Update UI state based on selected object (if any)
        const activeObj = canvas.getActiveObject();
        if (activeObj && activeObj.type === 'i-text') {
          setActiveObject(activeObj);
          setFontSize(activeObj.fontSize || 20);
          setFontFamily(activeObj.fontFamily || "Arial");
          setTextColor(activeObj.fill || "#000000");
          setIsBold(activeObj.fontWeight === 'bold');
          setIsItalic(activeObj.fontStyle === 'italic');
          setIsUnderline(activeObj.underline || false);
        } else {
          setActiveObject(null);
        }
      });
    }
  };
  
  // Add text to canvas
  const addText = () => {
    if (!canvas) return;
    
    const text = new window.fabric.IText('Click to edit', {
      left: (canvas.getWidth() / 2) * 0.95,
      top: (canvas.getHeight() / 2) * 0.95,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      originX: 'center',
      originY: 'center'
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    canvas.renderAll();
    
    setActiveObject(text);
    // History state will be saved via the object:added event
  };
  
  // Update text formatting
  const updateTextFormatting = (property, value) => {
    if (!activeObject) return;
    
    activeObject.set(property, value);
    canvas.renderAll();
    
    // Save state after updating formatting
    saveToHistory();
  };

  // Font size handlers
  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 72);
    setFontSize(newSize);
    updateTextFormatting("fontSize", newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 8);
    setFontSize(newSize);
    updateTextFormatting("fontSize", newSize);
  };

  if (!fabricLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div>
          <img src={logo} />
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-2 rounded-lg ${
              historyIndex <= 0 
                ? 'text-gray-300' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Undo"
          >
            <Undo2 size={20} />
          </button>
          
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-lg ${
              historyIndex >= history.length - 1
                ? 'text-gray-300'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Redo"
          >
            <Redo2 size={20} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-3">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="w-full" />
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center space-x-6">
            
            {/* Font Family */}
            <select 
              value={fontFamily} 
              onChange={(e) => {
                setFontFamily(e.target.value);
                updateTextFormatting("fontFamily", e.target.value);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
            
            {/* Font Size Controls */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={decreaseFontSize}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-medium">{fontSize}</span>
              <button 
                onClick={increaseFontSize}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* Text Style Buttons */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => {
                  const newValue = !isBold;
                  setIsBold(newValue);
                  updateTextFormatting("fontWeight", newValue ? 'bold' : 'normal');
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isBold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Bold size={16} />
              </button>
              
              <button 
                onClick={() => {
                  const newValue = !isItalic;
                  setIsItalic(newValue);
                  updateTextFormatting("fontStyle", newValue ? 'italic' : 'normal');
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isItalic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Italic size={16} />
              </button>
              
              <button 
                onClick={() => {
                  const newValue = !isUnderline;
                  setIsUnderline(newValue);
                  updateTextFormatting("underline", newValue);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isUnderline ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Underline size={16} />
              </button>
            </div>

            {/* Add Text Button */}
            <button 
              onClick={addText}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Type size={16} />
              <span className="text-sm font-medium">Add text</span>
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}

// USING FABRIC.JS FROM NPM
// import { useEffect, useRef, useState } from "react";
// import * as fabric from 'fabric';
// import { Undo2, Redo2 } from "lucide-react";

// // We'll use a functional component approach
// export default function TextEditorApp() {
//   const canvasRef = useRef(null);
//   const [canvas, setCanvas] = useState(null);
//   const [fontSize, setFontSize] = useState(20);
//   const [fontFamily, setFontFamily] = useState("Arial");
//   const [isBold, setIsBold] = useState(false);
//   const [isItalic, setIsItalic] = useState(false);
//   const [isUnderline, setIsUnderline] = useState(false);
//   const [textColor, setTextColor] = useState("#000000");
//   const [activeObject, setActiveObject] = useState(null);
  
//   // History tracking for undo/redo
//   const [history, setHistory] = useState([]);
//   const [historyIndex, setHistoryIndex] = useState(-1);
//   const [isPerformingUndoRedo, setIsPerformingUndoRedo] = useState(false);


//   // Initialize Canvas
//   useEffect(() => {
//     if (canvasRef.current && !canvas) {
//       // Get the container element dimensions
//       const containerEl = canvasRef.current.parentElement;
//       const containerWidth = containerEl.clientWidth;
      
//       // Calculate height with a reasonable aspect ratio (e.g., 16:9)
//       const containerHeight = Math.min(containerWidth * 0.6, window.innerHeight * 0.6);
      
//       const fabricCanvas = new fabric.Canvas(canvasRef.current, {
//         width: containerWidth,
//         height: containerHeight,
//         backgroundColor: "#f8f9fa"
//       });
      
//       setCanvas(fabricCanvas);
      
//       // Set up event listeners
//       fabricCanvas.on('selection:created', handleObjectSelected);
//       fabricCanvas.on('selection:updated', handleObjectSelected);
//       fabricCanvas.on('selection:cleared', () => setActiveObject(null));
      
//       // Add event listeners for saving history states
//       fabricCanvas.on('object:modified', saveToHistory);
//       fabricCanvas.on('object:added', saveToHistory);
//       fabricCanvas.on('object:removed', saveToHistory);
      
//       // Initialize history with empty canvas state
//       saveCanvasToHistory(fabricCanvas);
      
//       // Handle window resize
//       const handleResize = () => {
//         const newWidth = containerEl.clientWidth;
//         const newHeight = Math.min(newWidth * 0.6, window.innerHeight * 0.6);
        
//         // Record current state before resize
//         const currentState = fabricCanvas.toJSON();
        
//         // Set new dimensions
//         fabricCanvas.setWidth(newWidth);
//         fabricCanvas.setHeight(newHeight);
        
//         // Scale objects proportionally
//         const scaleX = newWidth / fabricCanvas.getWidth();
//         const scaleY = newHeight / fabricCanvas.getHeight();
//         const objects = fabricCanvas.getObjects();
        
//         objects.forEach(obj => {
//           obj.scaleX = obj.scaleX * scaleX;
//           obj.scaleY = obj.scaleY * scaleY;
//           obj.left = obj.left * scaleX;
//           obj.top = obj.top * scaleY;
//           obj.setCoords();
//         });
        
//         fabricCanvas.renderAll();
        
//         // Save resized state to history
//         saveCanvasToHistory(fabricCanvas);
//       };
      
//       window.addEventListener('resize', handleResize);
      
//       return () => {
//         window.removeEventListener('resize', handleResize);
//         fabricCanvas.dispose();
//       };
//     }
//   }, [true]);
  
//   // Handle window resize for existing canvas
//   useEffect(() => {
//     if (!canvas) return;
    
//     const handleResize = () => {
//       const containerEl = canvasRef.current.parentElement;
//       const newWidth = containerEl.clientWidth;
//       const newHeight = Math.min(newWidth * 0.6, window.innerHeight * 1.0);
      
//       if (newWidth !== canvas.width || newHeight !== canvas.height) {
//         // Calculate scale factors
//         const scaleX = newWidth / canvas.width;
//         const scaleY = newHeight / canvas.height;
        
//         // Set new dimensions
//         canvas.setWidth(newWidth);
//         canvas.setHeight(newHeight);
        
//         // Scale all objects proportionally
//         canvas.getObjects().forEach(obj => {
//           const oldLeft = obj.left;
//           const oldTop = obj.top;
          
//           // Scale position
//           obj.set({
//             left: oldLeft * scaleX,
//             top: oldTop * scaleY,
//           });
          
//           obj.setCoords();
//         });
        
//         canvas.renderAll();
        
//         // Save the new state to history, but don't create a new history entry
//         // if we're just resizing the window
//         if (!isPerformingUndoRedo) {
//           // Update the current history entry instead of creating a new one
//           if (historyIndex >= 0) {
//             const newHistory = [...history];
//             newHistory[historyIndex] = canvas.toJSON();
//             setHistory(newHistory);
//           }
//         }
//       }
//     };
    
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, [canvas]);
  
//   // Add keyboard shortcuts for undo/redo
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       // Undo: Ctrl+Z
//       if (e.ctrlKey && e.key === 'z') {
//         e.preventDefault();
//         handleUndo();
//       }
      
//       // Redo: Ctrl+Y or Ctrl+Shift+Z
//       if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
//         e.preventDefault();
//         handleRedo();
//       }
//     };
    
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [historyIndex, history]);
  
//   // Save current canvas state to history
//   const saveToHistory = () => {
//     // Skip if we're currently performing an undo/redo operation
//     if (isPerformingUndoRedo) return;
    
//     setTimeout(() => {
//       saveCanvasToHistory(canvas);
//     }, 0);
//   };
  
//   const saveCanvasToHistory = (canvas) => {
//     // Create a JSON representation of the canvas
//     const json = canvas.toJSON();
    
//     // Truncate the history if we've gone back and then made changes
//     const newHistory = history.slice(0, historyIndex + 1);
//     newHistory.push(json);
    
//     setHistory(newHistory);
//     setHistoryIndex(newHistory.length - 1);
//   };
  
//   // Handle object selection
//   const handleObjectSelected = (e) => {
//     if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') {
//       const text = e.selected[0];
//       setActiveObject(text);
//       setFontSize(text.fontSize || 20);
//       setFontFamily(text.fontFamily || "Arial");
//       setTextColor(text.fill || "#000000");
//       setIsBold(text.fontWeight === 'bold');
//       setIsItalic(text.fontStyle === 'italic');
//       setIsUnderline(text.underline || false);
//     }
//   };
  
//   // Undo function
//   const handleUndo = () => {
//     if (historyIndex > 0) {
//       setIsPerformingUndoRedo(true);
      
//       const newIndex = historyIndex - 1;
//       const previousState = history[newIndex];
      
//       // Clear the canvas and load the previous state
//       canvas.clear();
//       canvas.loadFromJSON(previousState, () => {
//         canvas.renderAll();
//         setHistoryIndex(newIndex);
//         setIsPerformingUndoRedo(false);
        
//         // Update UI state based on selected object (if any)
//         const activeObj = canvas.getActiveObject();
//         if (activeObj && activeObj.type === 'i-text') {
//           setActiveObject(activeObj);
//           setFontSize(activeObj.fontSize || 20);
//           setFontFamily(activeObj.fontFamily || "Arial");
//           setTextColor(activeObj.fill || "#000000");
//           setIsBold(activeObj.fontWeight === 'bold');
//           setIsItalic(activeObj.fontStyle === 'italic');
//           setIsUnderline(activeObj.underline || false);
//         } else {
//           setActiveObject(null);
//         }
//       });
//     }
//   };
  
//   // Redo function
//   const handleRedo = () => {
//     if (historyIndex < history.length - 1) {
//       setIsPerformingUndoRedo(true);
      
//       const newIndex = historyIndex + 1;
//       const nextState = history[newIndex];
      
//       // Clear the canvas and load the next state
//       canvas.clear();
//       canvas.loadFromJSON(nextState, () => {
//         canvas.renderAll();
//         setHistoryIndex(newIndex);
//         setIsPerformingUndoRedo(false);
        
//         // Update UI state based on selected object (if any)
//         const activeObj = canvas.getActiveObject();
//         if (activeObj && activeObj.type === 'i-text') {
//           setActiveObject(activeObj);
//           setFontSize(activeObj.fontSize || 20);
//           setFontFamily(activeObj.fontFamily || "Arial");
//           setTextColor(activeObj.fill || "#000000");
//           setIsBold(activeObj.fontWeight === 'bold');
//           setIsItalic(activeObj.fontStyle === 'italic');
//           setIsUnderline(activeObj.underline || false);
//         } else {
//           setActiveObject(null);
//         }
//       });
//     }
//   };
  
//   // Add text to canvas
//   const addText = () => {
//     if (!canvas) return;
    
//     const text = new fabric.IText('Click to edit', {
//       left: 100,
//       top: 100,
//       fontSize: fontSize,
//       fontFamily: fontFamily,
//       fill: textColor,
//       fontWeight: isBold ? 'bold' : 'normal',
//       fontStyle: isItalic ? 'italic' : 'normal',
//       underline: isUnderline
//     });
    
//     canvas.add(text);
//     canvas.setActiveObject(text);
//     text.enterEditing();
//     text.selectAll();
//     canvas.renderAll();
    
//     setActiveObject(text);
//     // History state will be saved via the object:added event
//   };
  
//   // Update text formatting
//   const updateTextFormatting = (property, value) => {
//     if (!activeObject) return;
    
//     activeObject.set(property, value);
//     canvas.renderAll();
    
//     // Save state after updating formatting
//     saveToHistory();
//   };
  
//   return (
//     <div className="p-4 max-w-full mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Text Editor with Fabric.js</h1>
      
//       {/* Text controls */}
//       <div className="bg-gray-100 p-4 mb-4 rounded flex flex-wrap gap-3 items-center">
//         <button 
//           onClick={addText}
//           className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Add Text
//         </button>
        
//         <select 
//           value={fontFamily} 
//           onChange={(e) => {
//             setFontFamily(e.target.value);
//             updateTextFormatting("fontFamily", e.target.value);
//           }}
//           className="px-2 py-1 border border-gray-300 rounded"
//           disabled={!activeObject}
//         >
//           <option value="Arial">Arial</option>
//           <option value="Times New Roman">Times New Roman</option>
//           <option value="Courier New">Courier New</option>
//           <option value="Georgia">Georgia</option>
//           <option value="Verdana">Verdana</option>
//         </select>
        
//         <input 
//           type="number" 
//           value={fontSize} 
//           onChange={(e) => {
//             const newSize = parseInt(e.target.value, 10);
//             setFontSize(newSize);
//             updateTextFormatting("fontSize", newSize);
//           }}
//           className="w-16 px-2 py-1 border border-gray-300 rounded"
//           min="8"
//           max="72"
//           disabled={!activeObject}
//         />
        
//         <input 
//           type="color" 
//           value={textColor} 
//           onChange={(e) => {
//             setTextColor(e.target.value);
//             updateTextFormatting("fill", e.target.value);
//           }}
//           className="w-8 h-8 border border-gray-300 rounded"
//           disabled={!activeObject}
//         />
        
//         <button 
//           onClick={() => {
//             const newValue = !isBold;
//             setIsBold(newValue);
//             updateTextFormatting("fontWeight", newValue ? 'bold' : 'normal');
//           }}
//           className={`px-2 py-1 border border-gray-300 rounded ${
//             isBold ? 'bg-gray-300' : 'bg-white'
//           }`}
//           disabled={!activeObject}
//         >
//           B
//         </button>
        
//         <button 
//           onClick={() => {
//             const newValue = !isItalic;
//             setIsItalic(newValue);
//             updateTextFormatting("fontStyle", newValue ? 'italic' : 'normal');
//           }}
//           className={`px-2 py-1 border border-gray-300 rounded ${
//             isItalic ? 'bg-gray-300' : 'bg-white'
//           }`}
//           disabled={!activeObject}
//         >
//           I
//         </button>
        
//         <button 
//           onClick={() => {
//             const newValue = !isUnderline;
//             setIsUnderline(newValue);
//             updateTextFormatting("underline", newValue);
//           }}
//           className={`px-2 py-1 border border-gray-300 rounded ${
//             isUnderline ? 'bg-gray-300' : 'bg-white'
//           }`}
//           disabled={!activeObject}
//         >
//           U
//         </button>
        
//         {/* Undo/Redo buttons */}
//         <div className="ml-auto flex items-center">
//           <button 
//             onClick={handleUndo}
//             disabled={historyIndex <= 0}
//             className={`p-2 rounded mr-1 flex items-center ${
//               historyIndex <= 0 ? 'bg-gray-200 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'
//             }`}
//             title="Undo (Ctrl+Z)"
//           >
//             <Undo2 size={16} />
//           </button>
          
//           <button 
//             onClick={handleRedo}
//             disabled={historyIndex >= history.length - 1}
//             className={`p-2 rounded flex items-center ${
//               historyIndex >= history.length - 1
//                 ? 'bg-gray-200 text-gray-400'
//                 : 'bg-gray-200 hover:bg-gray-300'
//             }`}
//             title="Redo (Ctrl+Y)"
//           >
//             <Redo2 size={16} />
//           </button>
//         </div>
//       </div>
      
//       {/* Canvas */}
//       <div className="border border-gray-300 rounded w-full">
//         <canvas ref={canvasRef} />
//       </div>
      
//       {/* Status display */}
//       {/* <div className="mt-4 flex justify-between">
//         <div className="text-sm text-gray-600">
//           <p>Instructions:</p>
//           <ul className="list-disc pl-5">
//             <li>Click "Add Text" to add editable text</li>
//             <li>Click on text to select and move it</li>
//             <li>Double-click to edit text directly on canvas</li>
//             <li>Use Undo/Redo buttons or Ctrl+Z/Ctrl+Y to navigate history</li>
//           </ul>
//         </div>
        
//         <div className="text-sm text-gray-600">
//           <p>History: {historyIndex + 1}/{history.length}</p>
//         </div>
//       </div> */}
//     </div>
//   );
// }