import { Plus, Minus, Bold, Italic, Underline, Type } from "lucide-react";

const Toolbar = ({
  fontFamily,
  setFontFamily,
  fontSize,
  onFontSizeChange,
  isBold,
  onBoldToggle,
  isItalic,
  onItalicToggle,
  isUnderline,
  onUnderlineToggle,
  textColor,
  setTextColor,
  onAddText,
  onFormatUpdate
}) => {
  const fontOptions = [
    { value: "Arial", label: "Arial" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Courier New", label: "Courier New" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" }
  ];

  const handleFontFamilyChange = (e) => {
    const newFont = e.target.value;
    setFontFamily(newFont);
    onFormatUpdate("fontFamily", newFont);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 72);
    onFontSizeChange(newSize);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 8);
    onFontSizeChange(newSize);
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setTextColor(newColor);
    onFormatUpdate("fill", newColor);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center space-x-6">
          
          {/* Font Family */}
          <select 
            value={fontFamily} 
            onChange={handleFontFamilyChange}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fontOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
              onClick={onBoldToggle}
              className={`p-2 rounded-lg transition-colors ${
                isBold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Bold size={16} />
            </button>
            
            <button 
              onClick={onItalicToggle}
              className={`p-2 rounded-lg transition-colors ${
                isItalic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Italic size={16} />
            </button>
            
            <button 
              onClick={onUnderlineToggle}
              className={`p-2 rounded-lg transition-colors ${
                isUnderline ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Underline size={16} />
            </button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2">
              <input
                type="color"
                value={textColor}
                onChange={handleColorChange}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                title="Text Color"
              />
          </div>

          {/* Add Text Button */}
          <button 
            onClick={onAddText}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Type size={16} />
            <span className="text-sm font-medium">Add text</span>
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default Toolbar;