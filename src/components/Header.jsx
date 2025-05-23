import { Undo2, Redo2 } from "lucide-react";

const Header = ({ logo, onUndo, onRedo, canUndo, canRedo }) => {
  return (
    <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
      <div>
        <img src={logo} alt="Logo" />
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg ${
            !canUndo 
              ? 'text-gray-300' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Undo"
        >
          <Undo2 size={20} />
        </button>
        
        <button 
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg ${
            !canRedo
              ? 'text-gray-300'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Redo"
        >
          <Redo2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default Header;