import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const RefinerSection = ({ title, isOpen, onToggle, children, headerRight }) => (
    <div className="bg-[#111] rounded-lg border border-white/5 flex flex-col mb-4 shadow-lg">
        <div
            className="bg-[#1f1f1f] px-3 py-2 border-b border-white/5 font-semibold text-xs text-cyan-300 flex justify-between items-center cursor-pointer select-none hover:bg-black/40 transition-colors"
            onClick={onToggle}
        >
            <div className="flex items-center gap-2 uppercase tracking-wider">
                {isOpen ? <ChevronDown size={14} className="text-cyan-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                <span>{title}</span>
            </div>
            {headerRight && <div onClick={e => e.stopPropagation()}>{headerRight}</div>}
        </div>
        {isOpen && (
            <div className="p-4 bg-[#1a1a1a] rounded-b-lg">
                {children}
            </div>
        )}
    </div>
);

export default RefinerSection;
