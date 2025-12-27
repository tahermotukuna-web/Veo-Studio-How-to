
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { XMarkIcon } from './icons';

interface GoogleAuthDialogProps {
  onSelect: (user: { name: string; email: string; avatar: string }) => void;
  onClose: () => void;
}

const accounts = [
  { name: 'Alex Johnson', email: 'alex.j@gmail.com', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { name: 'Production Studio', email: 'studio.prime@gmail.com', avatar: 'https://i.pravatar.cc/150?u=studio' },
  { name: 'Review Master', email: 'reviews.daily@gmail.com', avatar: 'https://i.pravatar.cc/150?u=review' }
];

const GoogleAuthDialog: React.FC<GoogleAuthDialogProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
      <div className="bg-white text-gray-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 pb-4 text-center">
          <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" className="h-6 mx-auto mb-6" alt="Google" />
          <h2 className="text-xl font-medium mb-1">Choose an account</h2>
          <p className="text-sm text-gray-600">to continue to Veo Production Studio</p>
        </div>
        
        <div className="px-2 pb-6">
          {accounts.map((acc, i) => (
            <button 
              key={i}
              onClick={() => onSelect(acc)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0 text-left"
            >
              <img src={acc.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt={acc.name} />
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{acc.name}</p>
                <p className="text-xs text-gray-500 truncate">{acc.email}</p>
              </div>
            </button>
          ))}
          
          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 transition-colors text-left">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-600 text-xl">+</span>
            </div>
            <p className="text-sm font-medium text-gray-700">Use another account</p>
          </button>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 text-[10px] text-gray-500 leading-relaxed border-t border-gray-200">
          To continue, Google will share your name, email address, language preference, and profile picture with Veo Studio.
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthDialog;
