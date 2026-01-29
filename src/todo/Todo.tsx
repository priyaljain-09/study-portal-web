import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';
import { useGetStudentTodoListQuery } from '../redux/api/todoApi';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { CheckCircle2, Circle } from 'lucide-react';
import type { TodoItem } from '../redux/api/todoApi';

interface ProcessedTodoItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const Todo = () => {
  const navigate = useNavigate();
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const { data: todoList = [], isLoading } = useGetStudentTodoListQuery();

  const userInitial =
    userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const todos: ProcessedTodoItem[] = useMemo(() => {
    if (!Array.isArray(todoList)) return [];

    return todoList.map((item: TodoItem) => ({
      id: String(item.id),
      title: item.title,
      description: item.subject_name
        ? `${item.subject_name} - ${
            item.description?.replace(/<[^>]*>?/gm, '') || ''
          }`
        : undefined,
      dueDate: item.due_date
        ? new Date(item.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : undefined,
      completed: item.is_submitted,
      priority:
        item.days_remaining !== undefined && item.days_remaining <= 2
          ? 'high'
          : item.days_remaining !== undefined && item.days_remaining <= 5
          ? 'medium'
          : 'low',
    }));
  }, [todoList]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  const handleBackPress = () => {
    navigate('/dashboard');
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return '';
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activePath="/todo" />
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
          onBackClick={handleBackPress}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">To-Do</h1>
              <p className="text-sm text-gray-600">
                {completedCount} of {totalCount} completed
              </p>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : todos.length > 0 ? (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`
                      bg-white rounded-lg p-4 shadow-sm border-l-4 transition
                      ${todo.completed ? 'border-green-500' : 'border-primary'}
                    `}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="mt-1">
                        {todo.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`
                            text-base font-semibold mb-1
                            ${todo.completed
                              ? 'text-gray-400 line-through'
                              : 'text-gray-900'
                            }
                          `}
                        >
                          {todo.title}
                        </h3>

                        {todo.description && (
                          <p
                            className={`
                              text-sm
                              ${todo.completed
                                ? 'text-gray-400'
                                : 'text-gray-600'
                              }
                            `}
                          >
                            {todo.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-9">
                      {todo.dueDate && (
                        <div className="bg-gray-100 rounded-md px-2.5 py-1">
                          <span className="text-xs font-medium text-gray-700">
                            Due: {todo.dueDate}
                          </span>
                        </div>
                      )}

                      {todo.priority && (
                        <div
                          className="rounded-md px-2.5 py-1"
                          style={{
                            backgroundColor: getPriorityColor(todo.priority),
                          }}
                        >
                          <span className="text-xs font-semibold text-white">
                            {getPriorityLabel(todo.priority)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  No tasks to do
                </p>
                <p className="text-sm text-gray-500">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Todo;

