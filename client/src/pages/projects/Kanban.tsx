import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';
import { avatarUrl } from '../../lib/utils';

interface Task { id: number; title: string; orderIndex: number; assignee?: { id: number; name: string; profilePhotoPath: string | null } | null }
interface Column { id: number; name: string; color: string | null; tasks: Task[] }
interface Board { id: number; name: string; columns: Column[]; projectId?: number; projectTitle?: string }

export default function Kanban() {
  const { id } = useParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskColumn, setNewTaskColumn] = useState<number>(0);
  const draggedTaskRef = useRef<{ taskId: number; fromColumnId: number } | null>(null);

  useEffect(() => {
    api.get(`/kanban/projects/${id}/board`).then((res) => {
      setBoard(res.data.board);
      if (res.data.board?.columns?.length > 0) setNewTaskColumn(res.data.board.columns[0].id);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDragStart = (e: React.DragEvent, taskId: number, columnId: number) => {
    draggedTaskRef.current = { taskId, fromColumnId: columnId };
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50');
  };

  const handleDrop = async (e: React.DragEvent, toColumnId: number) => {
    e.preventDefault();
    const drag = draggedTaskRef.current;
    if (!drag || drag.fromColumnId === toColumnId) return;

    try {
      await api.post(`/kanban/tasks/${drag.taskId}/move`, { column_id: toColumnId, order_index: 0 });
      setBoard((prev) => {
        if (!prev) return prev;
        let task: Task | undefined;
        const cols = prev.columns.map((c) => {
          if (c.id === drag.fromColumnId) {
            task = c.tasks.find((t) => t.id === drag.taskId);
            return { ...c, tasks: c.tasks.filter((t) => t.id !== drag.taskId) };
          }
          return c;
        });
        if (task) {
          return { ...prev, columns: cols.map((c) => c.id === toColumnId ? { ...c, tasks: [...c.tasks, task!] } : c) };
        }
        return { ...prev, columns: cols };
      });
    } catch { showToast('Failed to move task', 'error'); }
    draggedTaskRef.current = null;
  };

  const saveTask = async () => {
    if (!newTaskTitle.trim() || !board) return;
    try {
      const res = await api.post(`/kanban/boards/${board.id}/tasks`, { title: newTaskTitle, column_id: newTaskColumn });
      setBoard((prev) => {
        if (!prev) return prev;
        return { ...prev, columns: prev.columns.map((c) => c.id === newTaskColumn ? { ...c, tasks: [...c.tasks, res.data] } : c) };
      });
      setNewTaskTitle('');
      setShowModal(false);
    } catch { showToast('Failed to add task', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading board...</div>;
  if (!board) return <div className="p-6 text-center text-gray-500">Board not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <i className="fa-solid fa-table-columns text-indigo-600" />
            {board.projectTitle || board.name}
          </h1>
          <p className="text-sm text-gray-500">Project board</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/projects/${id}`} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold bg-white transition">
            Back to project
          </Link>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition">
            <i className="fa-solid fa-plus mr-1" /> New task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
        <div className="flex h-full gap-4 pb-4 min-w-max">
          {board.columns.map((column) => (
            <div key={column.id} className="w-80 flex-shrink-0 flex flex-col bg-gray-50 border border-gray-200 rounded-lg"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column.id)}>
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between border-b border-gray-200 bg-white rounded-t-lg">
                <h3 className="font-semibold text-gray-800 text-sm">{column.name}</h3>
                <span className="bg-gray-50 px-2 py-0.5 rounded text-xs text-gray-600 font-semibold border border-gray-200">{column.tasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="px-3 py-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {column.tasks.length > 0 ? column.tasks.map((task) => (
                  <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id, column.id)} onDragEnd={handleDragEnd}
                    className="bg-white p-3 rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">#{task.id}</span>
                      <button className="text-gray-300 hover:text-gray-500"><i className="fa-solid fa-ellipsis" /></button>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-3">{task.title}</p>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
                      <div className="flex items-center gap-1.5">
                        {task.assignee && (
                          <img src={avatarUrl(task.assignee.name, task.assignee.profilePhotoPath)} className="w-5 h-5 rounded-full object-cover" title={task.assignee.name} />
                        )}
                        <button className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 text-[10px]">
                          <i className="fa-solid fa-plus" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span><i className="fa-regular fa-message" /> 0</span>
                        <span><i className="fa-solid fa-paperclip" /> 0</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                    Empty column
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/40 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg border border-gray-200 text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold text-gray-900">New task</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveTask()}
                      className="block w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2"
                      placeholder="Task title" autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                    <select value={newTaskColumn} onChange={(e) => setNewTaskColumn(Number(e.target.value))}
                      className="block w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2">
                      {board.columns.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 border-t border-gray-200">
                <button onClick={saveTask} className="w-full sm:w-auto inline-flex justify-center rounded-lg px-4 py-2 bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700">
                  Create
                </button>
                <button onClick={() => setShowModal(false)} className="mt-2 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-200 px-4 py-2 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
