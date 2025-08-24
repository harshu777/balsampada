'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  BookOpen, Plus, Edit2, Trash2, Save, X, 
  ChevronRight, Video, FileText, HelpCircle, ClipboardList,
  GripVertical
} from 'lucide-react';

interface Lesson {
  _id?: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  content: {
    url?: string;
    duration?: number;
    fileSize?: number;
  };
  order: number;
  isPreview: boolean;
  resources: any[];
}

interface Module {
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface ClassData {
  _id: string;
  title: string;
  modules: Module[];
}

export default function ModulesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lessonId: string } | null>(null);
  const [newModule, setNewModule] = useState<Module | null>(null);
  const [newLesson, setNewLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);

  useEffect(() => {
    fetchClassData();
  }, [params.id]);

  const fetchClassData = async () => {
    try {
      const response = await api.get(`/classes/${params.id}`);
      setClassData(response.data.data);
      setModules(response.data.data.modules || []);
    } catch (error) {
      console.error('Error fetching class:', error);
      toast.error('Failed to load class data');
      router.push('/teacher/classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = () => {
    const newMod: Module = {
      title: '',
      description: '',
      order: modules.length + 1,
      lessons: []
    };
    setNewModule(newMod);
  };

  const handleSaveNewModule = async () => {
    if (!newModule || !newModule.title) {
      toast.error('Module title is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post(`/classes/${params.id}/modules`, newModule);
      toast.success('Module added successfully');
      setModules(response.data.data.modules);
      setNewModule(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add module');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateModule = async (moduleId: string, updatedModule: Module) => {
    setSaving(true);
    try {
      const response = await api.put(`/classes/${params.id}/modules/${moduleId}`, updatedModule);
      toast.success('Module updated successfully');
      setModules(response.data.data.modules);
      setEditingModule(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    setSaving(true);
    try {
      const response = await api.delete(`/classes/${params.id}/modules/${moduleId}`);
      toast.success('Module deleted successfully');
      setModules(response.data.data.modules);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete module');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = (moduleId: string) => {
    const newLes: Lesson = {
      title: '',
      description: '',
      type: 'video',
      content: {},
      order: modules.find(m => m._id === moduleId)?.lessons.length || 0 + 1,
      isPreview: false,
      resources: []
    };
    setNewLesson({ moduleId, lesson: newLes });
  };

  const handleSaveNewLesson = async () => {
    if (!newLesson || !newLesson.lesson.title) {
      toast.error('Lesson title is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post(
        `/classes/${params.id}/modules/${newLesson.moduleId}/lessons`,
        newLesson.lesson
      );
      toast.success('Lesson added successfully');
      setModules(response.data.data.modules);
      setNewLesson(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add lesson');
    } finally {
      setSaving(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      case 'assignment': return <ClipboardList className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/teacher/classes/${params.id}`)}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back to Class
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Manage Modules & Lessons</h1>
          <p className="mt-2 text-gray-600">
            {classData?.title}
          </p>
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <div key={module._id} className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                {editingModule === module._id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => {
                        const updated = [...modules];
                        updated[moduleIndex].title = e.target.value;
                        setModules(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Module title"
                    />
                    <textarea
                      value={module.description}
                      onChange={(e) => {
                        const updated = [...modules];
                        updated[moduleIndex].description = e.target.value;
                        setModules(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Module description"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateModule(module._id!, module)}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingModule(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        {module.description && (
                          <p className="text-gray-600 mt-1">{module.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingModule(module._id!)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module._id!)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="space-y-2 mb-4">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson._id || lessonIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          {getLessonIcon(lesson.type)}
                          <span className="flex-1">{lesson.title}</span>
                          <span className="text-sm text-gray-500">{lesson.type}</span>
                          {lesson.isPreview && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Preview</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Lesson Form */}
                    {newLesson && newLesson.moduleId === module._id ? (
                      <div className="border-t pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={newLesson.lesson.title}
                            onChange={(e) => setNewLesson({
                              ...newLesson,
                              lesson: { ...newLesson.lesson, title: e.target.value }
                            })}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Lesson title"
                          />
                          <select
                            value={newLesson.lesson.type}
                            onChange={(e) => setNewLesson({
                              ...newLesson,
                              lesson: { ...newLesson.lesson, type: e.target.value as any }
                            })}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="quiz">Quiz</option>
                            <option value="assignment">Assignment</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          value={newLesson.lesson.description}
                          onChange={(e) => setNewLesson({
                            ...newLesson,
                            lesson: { ...newLesson.lesson, description: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Lesson description"
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newLesson.lesson.isPreview}
                              onChange={(e) => setNewLesson({
                                ...newLesson,
                                lesson: { ...newLesson.lesson, isPreview: e.target.checked }
                              })}
                            />
                            <span className="text-sm">Allow preview</span>
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNewLesson}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Add Lesson
                          </button>
                          <button
                            onClick={() => setNewLesson(null)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddLesson(module._id!)}
                        className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add New Module Form */}
          {newModule ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Module</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Module title"
                  autoFocus
                />
                <textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Module description (optional)"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNewModule}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {saving ? 'Saving...' : 'Save Module'}
                  </button>
                  <button
                    onClick={() => setNewModule(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleAddModule}
              className="w-full p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
            >
              <div className="flex flex-col items-center">
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">Add New Module</span>
                <span className="text-sm text-gray-500 mt-1">
                  Organize your class content into modules
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push(`/teacher/classes/${params.id}`)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Class
          </button>
          {modules.length > 0 && (
            <button
              onClick={() => {
                toast.success('Class can now be published!');
                router.push(`/teacher/classes/${params.id}`);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Done - Ready to Publish
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}