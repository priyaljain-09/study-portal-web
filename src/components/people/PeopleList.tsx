import { useState, useMemo } from 'react';
import { Search, Mail, Phone, MessageCircle, Users, GraduationCap, X } from 'lucide-react';
import { useGetPeopleBySubjectQuery } from '../../redux/api/peopleApi';
import Avatar from '../Avatar';

interface Person {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'teacher' | 'student' | 'assistant';
  avatar?: string;
  department?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  tag?: string;
  grade?: string;
  enrollment_number?: string;
  roll_number?: string;
  qualification?: string;
}

interface PeopleListProps {
  subjectId: number;
  classroomId?: number;
  onPersonClick?: (person: Person) => void;
}

const PeopleList: React.FC<PeopleListProps> = ({
  subjectId,
  classroomId,
  onPersonClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'students' | 'teachers'>('all');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const { data: peopleData, isLoading } = useGetPeopleBySubjectQuery(
    {
      subjectId,
      classroomId,
      filter: selectedFilter,
    },
    {
      skip: !subjectId,
    }
  );

  // Map API response to Person interface
  const mapApiResponseToPerson = (apiPerson: any): Person => {
    return {
      id: apiPerson.id,
      name: apiPerson.name || apiPerson.username || 'Unknown',
      email: apiPerson.email || '',
      phone: apiPerson.phone || undefined,
      role: (apiPerson.role || 'student') as 'teacher' | 'student' | 'assistant',
      avatar: apiPerson.avatar || apiPerson.profile_picture || undefined,
      department: apiPerson.subject?.name || apiPerson.qualification || apiPerson.department || undefined,
      status: 'offline' as 'online' | 'offline' | 'away', // Default to offline
      lastSeen: undefined,
      tag: apiPerson.tag,
      grade: apiPerson.grade,
      enrollment_number: apiPerson.enrollment_number,
      roll_number: apiPerson.roll_number,
      qualification: apiPerson.qualification,
    };
  };

  // Get people list from API response
  const peopleList: Person[] = useMemo(() => {
    if (!peopleData) return [];
    
    // Handle different response formats
    const results = Array.isArray(peopleData) 
      ? peopleData 
      : (peopleData.results || peopleData.people || []);
    
    return results.map(mapApiResponseToPerson);
  }, [peopleData]);

  // Filter people based on search query
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) {
      return peopleList;
    }

    const query = searchQuery.toLowerCase();
    return peopleList.filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query) ||
        person.department?.toLowerCase().includes(query)
    );
  }, [searchQuery, peopleList]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10B981';
      case 'away':
        return '#F59E0B';
      case 'offline':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap size={14} color="#8B5CF6" />;
      case 'assistant':
        return <Users size={14} color="#06B6D4" />;
      default:
        return <Users size={14} color="#6B7280" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return '#8B5CF6';
      case 'assistant':
        return '#06B6D4';
      default:
        return '#6B7280';
    }
  };

  const handleContactPerson = (
    person: Person,
    type: 'email' | 'phone' | 'message',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    
    if (type === 'email') {
      const emailUrl = `mailto:${person.email}`;
      window.open(emailUrl, '_blank');
    } else if (type === 'phone' && person.phone) {
      const phoneUrl = `tel:${person.phone}`;
      window.open(phoneUrl, '_blank');
    } else if (type === 'message') {
      // Implement message functionality if needed
      console.log('Message functionality not implemented yet');
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (peopleData?.summary) {
      return {
        teachers: peopleData.summary.teachers_count || 0,
        students: peopleData.summary.students_count || 0,
        assistants: filteredPeople.filter((p) => p.role === 'assistant').length,
        online: peopleData.summary.online_count || 0,
      };
    }

    // Fallback to calculating from filtered people
    const teachers = filteredPeople.filter((p) => p.role === 'teacher').length;
    const students = filteredPeople.filter((p) => p.role === 'student').length;
    const assistants = filteredPeople.filter((p) => p.role === 'assistant').length;
    const online = filteredPeople.filter((p) => p.status === 'online').length;

    return { teachers, students, assistants, online };
  }, [peopleData, filteredPeople]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        {!isSearchExpanded ? (
          <button
            onClick={() => setIsSearchExpanded(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="flex-1 bg-transparent border-none outline-none text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setIsSearchExpanded(false);
                setSearchQuery('');
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <GraduationCap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.teachers}</div>
          <div className="text-xs text-gray-600 font-medium">Teachers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.students}</div>
          <div className="text-xs text-gray-600 font-medium">Students</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2"></div>
          <div className="text-2xl font-bold text-gray-900">{stats.online}</div>
          <div className="text-xs text-gray-600 font-medium">Online</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{filteredPeople.length}</div>
          <div className="text-xs text-gray-600 font-medium">Total</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Filter by role:</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              selectedFilter === 'all'
                ? 'bg-purple-50 border-purple-600 text-purple-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users
              size={14}
              color={selectedFilter === 'all' ? '#9333EA' : '#6B7280'}
            />
            <span className="text-sm font-medium">All</span>
          </button>
          <button
            onClick={() => setSelectedFilter('teachers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              selectedFilter === 'teachers'
                ? 'bg-purple-50 border-purple-600 text-purple-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <GraduationCap
              size={14}
              color={selectedFilter === 'teachers' ? '#9333EA' : '#8B5CF6'}
            />
            <span className="text-sm font-medium">Teachers</span>
          </button>
          <button
            onClick={() => setSelectedFilter('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${
              selectedFilter === 'students'
                ? 'bg-purple-50 border-purple-600 text-purple-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users
              size={14}
              color={selectedFilter === 'students' ? '#9333EA' : '#6B7280'}
            />
            <span className="text-sm font-medium">Students</span>
          </button>
        </div>
      </div>

      {/* People List */}
      {filteredPeople.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No People Found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'No people available in this subject'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPeople.map((person) => (
            <div
              key={person.id}
              onClick={() => onPersonClick?.(person)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Avatar with Status */}
                <div className="relative flex-shrink-0">
                  {person.avatar ? (
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar label={person.name} size={50} />
                  )}
                  <div
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
                    style={{ backgroundColor: getStatusColor(person.status) }}
                  />
                </div>

                {/* Person Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {person.name}
                    </h3>
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: `${getRoleBadgeColor(person.role)}15`,
                      }}
                    >
                      {getRoleIcon(person.role)}
                      <span
                        className="text-xs font-semibold capitalize"
                        style={{ color: getRoleBadgeColor(person.role) }}
                      >
                        {person.role}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-1">{person.email}</p>
                  
                  {person.department && (
                    <p className="text-xs text-gray-500 truncate mb-2">
                      {person.department}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getStatusColor(person.status) }}
                    />
                    <span className="text-xs text-gray-500 font-medium">
                      {person.status === 'online'
                        ? 'Online'
                        : person.status === 'away'
                        ? 'Away'
                        : person.lastSeen
                        ? `Last seen ${person.lastSeen}`
                        : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleContactPerson(person, 'email', e)}
                    className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                  </button>
                  {person.phone && (
                    <button
                      onClick={(e) => handleContactPerson(person, 'phone', e)}
                      className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition"
                      title="Call"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleContactPerson(person, 'message', e)}
                    className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center hover:bg-purple-100 transition"
                    title="Message"
                  >
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleList;

