import { useState, useEffect } from 'react';
import { MdCheckCircle, MdRadioButtonUnchecked, MdClose, MdAssignment } from 'react-icons/md';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../services/tasks.service';

/**
 * FloatingTaskWidget - A floating button that shows pending tasks
 * Allows users to view and toggle tasks from any page when enabled
 */

const FLOATING_TASK_ENABLED_KEY = 'floatingTaskEnabled';

export function useFloatingTaskEnabled() {
    const [enabled, setEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(FLOATING_TASK_ENABLED_KEY) === 'true';
        }
        return false;
    });

    const toggleEnabled = (value: boolean) => {
        setEnabled(value);
        localStorage.setItem(FLOATING_TASK_ENABLED_KEY, value.toString());
    };

    return { enabled, toggleEnabled };
}

interface FloatingTaskWidgetProps {
    enabled: boolean;
}

export function FloatingTaskWidget({ enabled }: FloatingTaskWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { tasks, toggleTask } = useTasks();

    // Only show open tasks
    const openTasks = tasks.filter(t => t.status === 'open');
    const taskCount = openTasks.length;

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    if (!enabled) return null;

    const handleToggleTask = (task: Task) => {
        toggleTask.mutate(task);
    };

    return (
        <>
            {/* Backdrop when open */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Task Panel */}
            <div
                className={`
          fixed bottom-20 right-6 w-80 max-h-[400px] bg-white rounded-xl shadow-2xl
          border border-gray-200 z-50 flex flex-col overflow-hidden
          transform transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <MdAssignment className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Quick Tasks</h3>
                            <p className="text-[10px] text-gray-500">{taskCount} pending</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <MdClose className="w-4 h-4" />
                    </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {openTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <MdCheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                            <p className="text-sm font-medium">All done!</p>
                            <p className="text-xs">No pending tasks</p>
                        </div>
                    ) : (
                        openTasks.slice(0, 10).map(task => (
                            <button
                                key={task.id}
                                onClick={() => handleToggleTask(task)}
                                className="w-full flex items-start gap-2.5 p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left group"
                            >
                                <MdRadioButtonUnchecked className="w-4 h-4 mt-0.5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 leading-tight line-clamp-2">{task.text}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold uppercase ${task.severity === 'high' ? 'text-red-500' :
                                                task.severity === 'medium' ? 'text-orange-400' : 'text-blue-400'
                                            }`}>
                                            {task.severity}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{task.age}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                {openTasks.length > 10 && (
                    <div className="p-2 border-t border-gray-100 bg-gray-50">
                        <p className="text-[10px] text-center text-gray-500">
                            +{openTasks.length - 10} more tasks
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50
          flex items-center justify-center
          bg-gradient-to-br from-blue-600 to-indigo-600
          hover:from-blue-700 hover:to-indigo-700
          hover:shadow-xl hover:scale-105
          active:scale-95
          transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-blue-500/30
        `}
                aria-label={`${taskCount} pending tasks`}
            >
                <MdAssignment className="w-6 h-6 text-white" />

                {/* Badge */}
                {taskCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                        {taskCount > 99 ? '99+' : taskCount}
                    </span>
                )}
            </button>
        </>
    );
}

export default FloatingTaskWidget;
