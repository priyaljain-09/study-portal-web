import { useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  useGetAnnouncementsBySubjectQuery,
  useDeleteAnnouncementMutation,
} from '../../redux/api/announcementApi';

interface AnnouncementListProps {
  subjectId: number;
  classroomId?: number;
  userRole: string;
  subjectName?: string;
  onAddAnnouncement?: () => void;
  onAnnouncementClick?: (announcement: any) => void;
  onEditAnnouncement?: (announcement: any) => void;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({
  subjectId,
  classroomId,
  userRole,
  onAddAnnouncement,
  onAnnouncementClick,
  onEditAnnouncement,
}) => {
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<number | null>(null);

  const { data: announcementsData, isLoading } = useGetAnnouncementsBySubjectQuery(
    { subjectId, classroomId },
    {
      skip: !subjectId,
    }
  );

  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    const formatted = new Intl.DateTimeFormat('en-GB', options).format(date);
    return formatted.replace(',', ' at');
  };

  const handleLongPress = (announcementId: number) => {
    if (userRole === 'teacher') {
      setSelectedAnnouncementId(
        selectedAnnouncementId === announcementId ? null : announcementId
      );
    }
  };

  const handleClick = (announcement: any) => {
    if (selectedAnnouncementId === announcement.id) {
      setSelectedAnnouncementId(null);
    } else if (onAnnouncementClick) {
      onAnnouncementClick(announcement);
    }
  };

  const handleEdit = (announcement: any) => {
    setSelectedAnnouncementId(null);
    if (onEditAnnouncement) {
      onEditAnnouncement(announcement);
    }
  };

  const handleDelete = async (announcementId: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeletingAnnouncementId(announcementId);
    try {
      await deleteAnnouncement({ announcementId, subjectId }).unwrap();
      setSelectedAnnouncementId(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Handle both array response and object with announcements property
  const announcements = Array.isArray(announcementsData) 
    ? announcementsData 
    : (announcementsData?.announcements || []);

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-4">No announcements yet</p>
        {userRole === 'teacher' && onAddAnnouncement ? (
          <button
            onClick={onAddAnnouncement}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create Announcement</span>
          </button>
        ) : (
          onAddAnnouncement && (
            <button
              onClick={onAddAnnouncement}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Announcement</span>
            </button>
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Announcement Button for Teachers */}
      {userRole === 'teacher' && onAddAnnouncement && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAddAnnouncement}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Announcement</span>
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-2">
        {announcements.map((announcement: any) => {
          const isSelected = selectedAnnouncementId === announcement.id;
          const isDeleting = deletingAnnouncementId === announcement.id;

          return (
            <div
              key={announcement.id}
              className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition ${
                isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
              } ${isDeleting ? 'opacity-60' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(announcement.id);
              }}
            >
              <div
                onClick={() => handleClick(announcement)}
                className="p-4 cursor-pointer"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 font-medium">Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-red-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-2">
                            {announcement.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Last post: {formatDate(announcement.created_at)}
                          </p>
                        </div>

                        {/* Action Buttons (for teachers when selected) */}
                        {userRole === 'teacher' && isSelected && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(announcement);
                              }}
                              className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                              title="Edit Announcement"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(announcement.id);
                              }}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementList;

