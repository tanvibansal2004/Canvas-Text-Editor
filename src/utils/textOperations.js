export const createTextObject = (canvas, options) => {
  const text = new window.fabric.IText('Click to edit', {
    left: (canvas.getWidth() / 2) * 0.95,
    top: (canvas.getHeight() / 2) * 0.95,
    fontSize: options.fontSize,
    fontFamily: options.fontFamily,
    fill: options.textColor,
    fontWeight: options.isBold ? 'bold' : 'normal',
    fontStyle: options.isItalic ? 'italic' : 'normal',
    underline: options.isUnderline,
    originX: 'center',
    originY: 'center'
  });
  
  canvas.add(text);
  canvas.setActiveObject(text);
  text.enterEditing();
  text.selectAll();
  canvas.renderAll();
  
  return text;
};

export const updateTextFormatting = (textObject, canvas, property, value) => {
  if (!textObject) return;
  
  textObject.set(property, value);
  canvas.renderAll();
};