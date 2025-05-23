import { useState } from "react";

export const useTextFormatting = () => {
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");

  const updateFromObject = (textObject) => {
    if (textObject && textObject.type === 'i-text') {
      setFontSize(textObject.fontSize || 20);
      setFontFamily(textObject.fontFamily || "Arial");
      setTextColor(textObject.fill || "#000000");
      setIsBold(textObject.fontWeight === 'bold');
      setIsItalic(textObject.fontStyle === 'italic');
      setIsUnderline(textObject.underline || false);
    }
  };

  const resetToDefaults = () => {
    setFontSize(20);
    setFontFamily("Arial");
    setTextColor("#000000");
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
  };

  return {
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
  };
};