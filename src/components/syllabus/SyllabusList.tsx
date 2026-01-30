import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useGetSyllabusBySubjectQuery,
  useDeleteSyllabusItemMutation,
} from '../../redux/api/syllabusApi';
import HTMLContentViewer from '../HTMLContentViewer';

interface SyllabusListProps {
  subjectId: number;
  classroomId?: number;
  userRole: string;
  onAddSyllabus?: () => void;
  onEditSyllabus?: (item: any) => void;
}

const SyllabusList: React.FC<SyllabusListProps> = ({
  subjectId,
  classroomId,
  userRole,
  onAddSyllabus,
  onEditSyllabus,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: syllabusData, isLoading } = useGetSyllabusBySubjectQuery(
    {
      subjectId,
      classroomId,
    },
    {
      skip: !subjectId,
    }
  );

  const [deleteSyllabusItem] = useDeleteSyllabusItemMutation();

  // Close menu when clicking outside
  useEffect(() => {
    if (selectedItemId !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setSelectedItemId(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedItemId]);

  const handleLongPress = (item: any) => {
    if (userRole === 'teacher') {
      setSelectedItemId(item.id);
    }
  };


  const handleEditSyllabus = (item: any) => {
    setSelectedItemId(null);
    if (onEditSyllabus) {
      onEditSyllabus(item);
    }
  };

  const handleDeleteSyllabus = async (itemId: number) => {
    setSelectedItemId(null);
    if (!window.confirm('Are you sure you want to delete this syllabus item?')) {
      return;
    }

    setDeletingItemId(itemId);
    try {
      await deleteSyllabusItem(itemId).unwrap();
    } catch (error) {
      console.error('Error deleting syllabus item:', error);
      alert('Failed to delete syllabus item. Please try again.');
    } finally {
      setDeletingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const syllabus = Array.isArray(syllabusData) ? syllabusData : (syllabusData?.syllabus || []);

  // Sort by order
  const sortedSyllabus = [...syllabus].sort((a: any, b: any) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });

  if (sortedSyllabus.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No syllabus data available.</p>
        {userRole === 'teacher' && onAddSyllabus ? (
          <button
            onClick={onAddSyllabus}
            className="flex items-center space-x-2 px-6 py-3 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition shadow-sm mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Syllabus Item</span>
          </button>
        ) : (
          onAddSyllabus && (
            <button
              onClick={onAddSyllabus}
              className="flex items-center space-x-2 px-6 py-3 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition shadow-sm mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Add Syllabus Item</span>
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Syllabus Button for Teachers */}
      {userRole === 'teacher' && onAddSyllabus && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAddSyllabus}
            className="flex items-center space-x-2 px-4 py-2 bg-[#043276] text-white rounded-lg hover:bg-[#043276]/90 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Syllabus Item</span>
          </button>
        </div>
      )}

      {/* Syllabus Table */}
      <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-md">
        {/* Table Header */}
        <div className="flex bg-gray-100 py-4 px-3 border-b-2 border-gray-300">
          <div className="flex-[2] px-2 text-center">
            <span className="font-bold text-sm text-gray-900">Chapter</span>
          </div>
          <div className="flex-[3] px-2 text-center border-l border-gray-300">
            <span className="font-bold text-sm text-gray-900">Description</span>
          </div>
          <div className="flex-[2] px-2 text-center border-l border-gray-300">
            <span className="font-bold text-sm text-gray-900">Assessment</span>
          </div>
        </div>

        {/* Table Body */}
        <div>
          {sortedSyllabus.map((item: any, index: number) => {
            const isDeleting = deletingItemId === item.id;
            const isSelected = selectedItemId === item.id;
            const isLastRow = index === sortedSyllabus.length - 1;

            return (
              <div
                key={item.id}
                className={`relative flex ${
                  isLastRow ? '' : 'border-b border-gray-300'
                } ${isDeleting ? 'opacity-60' : ''} ${
                  isSelected ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-50 transition`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleLongPress(item);
                }}
              >
                {isDeleting ? (
                  <div className="flex-1 flex items-center justify-center py-8 gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 font-medium">Deleting...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex-[2] px-3 py-4 border-r border-gray-300 flex items-center justify-center">
                      <span className="font-semibold text-sm text-gray-900 text-center">
                        {item.chapter_name}
                      </span>
                    </div>
                    <div className="flex-[3] px-3 py-4 border-r border-gray-300 flex items-center">
                      <div className="w-full">
                        <HTMLContentViewer
                          html={item.description || '<p></p>'}
                          textColor="#333"
                        />
                      </div>
                    </div>
                    <div className="flex-[2] px-3 py-4 flex items-center justify-center">
                      <span className="text-sm text-gray-900 font-medium text-center">
                        {item.assessment_name}
                      </span>
                    </div>

                    {/* Menu Dropdown (for teachers when selected) */}
                    {userRole === 'teacher' && isSelected && (
                      <div className="absolute right-4 top-4" ref={menuRef}>
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-[150px] z-20">
                          <button
                            onClick={() => handleEditSyllabus(item)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                          >
                            <Pencil className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">Edit</span>
                          </button>
                          <div className="border-t border-gray-200" />
                          <button
                            onClick={() => handleDeleteSyllabus(item.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-600">Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SyllabusList;





