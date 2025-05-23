const Canvas = ({ canvasRef }) => {
  return (
    <div className="flex-1 p-3">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default Canvas;