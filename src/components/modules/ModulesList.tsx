import { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Pencil, 
  Trash2, 
  Check,
  X
} from 'lucide-react';
import {
  useUpdateModuleMutation,
  useDeleteModuleMutation,
  useDeleteChapterMutation,
  useUploadMaterialMutation,
  useDeleteMaterialMutation,
  moduleApi,
} from '../../redux/api/moduleApi';
import { useAppDispatch } from '../../redux/hooks';

interface Chapter {
  id: number;
  name: string;
  description?: string;
  order?: number;
}

interface Material {
  id: number;
  title?: string;
  file: string;
  uploaded_at?: string;
  uploaded_by?: string;
}

interface Module {
  id: number;
  name: string;
  description?: string;
  chapters?: Chapter[];
  materials?: Material[];
}

interface ModulesListProps {
  modules: Module[];
  isLoading: boolean;
  userRole: string;
  subjectId: number;
  classroomId?: number;
  onAddModule?: () => void;
  onChapterClick?: (chapter: Chapter, module: Module) => void;
  onAddChapter?: (module: Module) => void;
  onEditChapter?: (chapter: Chapter, module: Module) => void;
}

const ModulesList: React.FC<ModulesListProps> = ({
  modules,
  isLoading,
  userRole,
  subjectId,
  classroomId,
  onAddModule,
  onChapterClick,
  onAddChapter,
  onEditChapter,
}) => {
  const dispatch = useAppDispatch();
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingModuleName, setEditingModuleName] = useState<string>('');
  const [savingModuleId, setSavingModuleId] = useState<number | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<{moduleId: number; chapterId: number} | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<{moduleId: number; materialId: number} | null>(null);
  const [hoveredModuleId, setHoveredModuleId] = useState<number | null>(null);
  const [hoveredChapterId, setHoveredChapterId] = useState<{moduleId: number; chapterId: number} | null>(null);

  const [updateModule] = useUpdateModuleMutation();
  const [deleteModule] = useDeleteModuleMutation();
  const [deleteChapter] = useDeleteChapterMutation();
  const [uploadMaterial] = useUploadMaterialMutation();
  const [deleteMaterial] = useDeleteMaterialMutation();

  const queryArgs = userRole === 'teacher' && classroomId
    ? { subjectId, classroomId }
    : { subjectId };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
    if (selectedModuleId === id) {
      setSelectedModuleId(null);
    }
  };

  const handleModuleClick = (module: Module) => {
    if (selectedModuleId === module.id) {
      setSelectedModuleId(null);
    } else {
      toggleExpand(module.id);
    }
  };

  const handleModuleLongPress = (module: Module) => {
    if (userRole === 'teacher') {
      setSelectedModuleId(module.id);
      setSelectedChapterId(null);
      setSelectedMaterialId(null);
    }
  };

  const handleChapterClick = (chapter: Chapter, module: Module) => {
    if (selectedChapterId?.chapterId === chapter.id && selectedChapterId?.moduleId === module.id) {
      setSelectedChapterId(null);
    } else if (onChapterClick) {
      onChapterClick(chapter, module);
    }
    setSelectedMaterialId(null);
  };

  const handleChapterLongPress = (chapter: Chapter, module: Module) => {
    if (userRole === 'teacher') {
      setSelectedChapterId({ moduleId: module.id, chapterId: chapter.id });
      setSelectedModuleId(null);
      setSelectedMaterialId(null);
    }
  };

  const handleMaterialClick = (material: Material, module: Module) => {
    if (selectedMaterialId?.materialId === material.id && selectedMaterialId?.moduleId === module.id) {
      setSelectedMaterialId(null);
    } else {
      window.open(material.file, '_blank');
    }
  };

  const handleMaterialLongPress = (material: Material, module: Module) => {
    if (userRole === 'teacher') {
      setSelectedMaterialId({ moduleId: module.id, materialId: material.id });
      setSelectedModuleId(null);
      setSelectedChapterId(null);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModuleId(module.id);
    setEditingModuleName(module.name);
  };

  const handleSaveModule = async (moduleId: number) => {
    if (!editingModuleName.trim()) {
      return;
    }

    setSavingModuleId(moduleId);
    const moduleData = { name: editingModuleName };

    // Optimistically update the cache
    const patchResult = dispatch(
      moduleApi.util.updateQueryData(
        userRole === 'teacher' && classroomId
          ? 'getModulesBySubjectAndClassroom'
          : 'getModulesBySubject',
        queryArgs,
        (draft: any) => {
          const modules = Array.isArray(draft) ? draft : (draft?.modules || []);
          const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);
          if (moduleIndex !== -1) {
            modules[moduleIndex] = { ...modules[moduleIndex], ...moduleData };
          }
        }
      )
    );

    try {
      await updateModule({ moduleId, moduleData }).unwrap();
      setEditingModuleId(null);
      setEditingModuleName('');
      setSelectedModuleId(null);
    } catch {
      patchResult.undo();
    } finally {
      setSavingModuleId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setEditingModuleName('');
  };

  const handleDeleteModule = async (module: Module) => {
    if (!window.confirm(`Are you sure you want to delete "${module.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingModuleId(module.id);

    // Optimistically update the cache
    const patchResult = dispatch(
      moduleApi.util.updateQueryData(
        userRole === 'teacher' && classroomId
          ? 'getModulesBySubjectAndClassroom'
          : 'getModulesBySubject',
        queryArgs,
        (draft: any) => {
          const modules = Array.isArray(draft) ? draft : (draft?.modules || []);
          const moduleIndex = modules.findIndex((m: any) => m.id === module.id);
          if (moduleIndex !== -1) {
            modules.splice(moduleIndex, 1);
          }
        }
      )
    );

    try {
      await deleteModule(module.id).unwrap();
    } catch {
      patchResult.undo();
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!window.confirm(`Are you sure you want to delete "${chapter.name}"? This action cannot be undone.`)) {
      return;
    }

    await deleteChapter(chapter.id).unwrap();
    setSelectedChapterId(null);
  };

  const handleDeleteMaterial = async (material: Material) => {
    if (!window.confirm(`Are you sure you want to delete "${material.title || 'this material'}"?`)) {
      return;
    }

    await deleteMaterial(material.id).unwrap();
    setSelectedMaterialId(null);
  };

  const handleAddMaterial = async (module: Module) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.ppt,.pptx';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && module.id) {
        try {
          await uploadMaterial({ moduleId: module.id, file }).unwrap();
        } catch (error) {
          console.error('Error uploading material:', error);
          alert('Failed to upload material. Please try again.');
        }
      }
    };
    input.click();
  };

  const getFileName = (material: Material): string => {
    if (material.title?.trim()) {
      return material.title;
    }
    if (material.file) {
      try {
        const url = new URL(material.file);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        if (fileName) {
          return decodeURIComponent(fileName);
        }
      } catch {
        const urlParts = material.file.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          return decodeURIComponent(fileName.split('?')[0]);
        }
      }
    }
    return 'File';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No modules available yet.</p>
        {userRole === 'teacher' && onAddModule && (
          <button
            onClick={onAddModule}
            className="mt-4 px-4 py-2 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition"
          >
            Add Module
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Module Button for Teachers */}
      {userRole === 'teacher' && onAddModule && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAddModule}
            className="flex items-center space-x-2 px-4 py-2 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Module</span>
          </button>
        </div>
      )}

      {/* Modules List */}
      {modules.map((module) => {
        const isExpanded = expandedIds.includes(module.id);
        const isEditing = editingModuleId === module.id;
        const isSelected = selectedModuleId === module.id;

        return (
          <div
            key={module.id}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition ${
              isSelected && userRole === 'teacher' ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            {/* Module Header */}
            <div
              className={`p-4 bg-gray-50 hover:bg-gray-100 transition cursor-pointer ${
                isSelected && userRole === 'teacher' ? 'bg-purple-50' : ''
              }`}
              onClick={() => handleModuleClick(module)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleModuleLongPress(module);
              }}
            >
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingModuleName}
                      onChange={(e) => setEditingModuleName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveModule(module.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveModule(module.id);
                      }}
                      disabled={savingModuleId === module.id}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                    >
                      {savingModuleId === module.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(module.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      <div 
                        className="flex-1 flex items-center justify-between group"
                        onMouseEnter={() => userRole === 'teacher' && setHoveredModuleId(module.id)}
                        onMouseLeave={() => setHoveredModuleId(null)}
                      >
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{module.name}</h3>
                          {module.description && (
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          )}
                        </div>
                        {/* Edit and Delete icons on hover (for teachers) */}
                        {userRole === 'teacher' && hoveredModuleId === module.id && !isEditing && (
                          <div className="flex items-center space-x-1 ml-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditModule(module);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit Module"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(module);
                              }}
                              disabled={deletingModuleId === module.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Module"
                            >
                              {deletingModuleId === module.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-white">
                {/* Add Content Button (for teachers) */}
                {userRole === 'teacher' && (
                  <div className="p-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => onAddChapter && onAddChapter(module)}
                        className="flex items-center space-x-2 px-3 py-2 text-[#043276] hover:bg-[#043276]/10 rounded-lg transition text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Chapter</span>
                      </button>
                      <button
                        onClick={() => handleAddMaterial(module)}
                        className="flex items-center space-x-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Material</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Chapters */}
                {module.chapters && module.chapters.length > 0 && (
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Chapters</h4>
                    {[...module.chapters]
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((chapter) => {
                        const isChapterSelected = selectedChapterId?.chapterId === chapter.id && 
                                                  selectedChapterId?.moduleId === module.id;
                        return (
                          <div
                            key={chapter.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition ${
                              isChapterSelected && userRole === 'teacher'
                                ? 'bg-purple-50 border-purple-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleChapterLongPress(chapter, module);
                            }}
                          >
                            <div 
                              className="flex-1 flex items-center justify-between group"
                              onMouseEnter={() => userRole === 'teacher' && setHoveredChapterId({ moduleId: module.id, chapterId: chapter.id })}
                              onMouseLeave={() => setHoveredChapterId(null)}
                            >
                              <button
                                onClick={() => handleChapterClick(chapter, module)}
                                className="flex-1 flex items-center space-x-3 text-left"
                              >
                                <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <p className="font-medium text-gray-900">{chapter.name}</p>
                              </button>
                              {/* Edit and Delete icons on hover (for teachers) */}
                              {userRole === 'teacher' && 
                               hoveredChapterId?.moduleId === module.id && 
                               hoveredChapterId?.chapterId === chapter.id && (
                                <div className="flex items-center space-x-1 ml-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditChapter && onEditChapter(chapter, module);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Edit Chapter"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteChapter(chapter);
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Materials */}
                {module.materials && module.materials.length > 0 && (
                  <div className={`p-4 space-y-2 ${module.chapters && module.chapters.length > 0 ? 'border-t border-gray-200' : ''}`}>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Materials</h4>
                    {module.materials.map((material) => {
                      const isMaterialSelected = selectedMaterialId?.materialId === material.id && 
                                                 selectedMaterialId?.moduleId === module.id;
                      const fileName = getFileName(material);
                      return (
                        <div
                          key={material.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition ${
                            isMaterialSelected && userRole === 'teacher'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleMaterialLongPress(material, module);
                          }}
                        >
                          <button
                            onClick={() => handleMaterialClick(material, module)}
                            className="flex-1 flex items-center space-x-3 text-left"
                          >
                            <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{fileName}</p>
                              {material.uploaded_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </button>
                          {userRole === 'teacher' && isMaterialSelected && (
                            <button
                              onClick={() => handleDeleteMaterial(material)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition ml-2"
                              title="Delete Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {(!module.chapters || module.chapters.length === 0) && 
                 (!module.materials || module.materials.length === 0) && 
                 userRole !== 'teacher' && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No content available for this module.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ModulesList;

