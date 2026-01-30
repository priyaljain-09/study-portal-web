import { useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAppSelector } from '../redux/hooks';
import { useFetchCalendarEventsQuery } from '../redux/api/calendarApi';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  event_type?: string;
  event_type_display?: string;
}

const Calendar = () => {
  const userProfile = useAppSelector((state) => state.applicationData.userProfile);
  const userInitial =
    userProfile?.user?.first_name?.charAt(0) ||
    userProfile?.user?.username?.charAt(0) ||
    'S';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: apiEvents = [], isLoading } = useFetchCalendarEventsQuery({
    month,
    year,
  });

  const eventsByDate = useMemo(() => {
    const eventsMap: Record<string, CalendarEvent[]> = {};

    apiEvents.forEach((apiEvent) => {
      const formattedTime = formatTime(apiEvent);
      const startDate = new Date(apiEvent.start_date);
      const endDate = new Date(apiEvent.end_date);

      const current = new Date(startDate);
      while (current <= endDate) {
        const dateKey = formatDateKey(current);
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push({
          id: `${apiEvent.id}-${dateKey}`,
          title: apiEvent.title,
          date: dateKey,
          time: formattedTime,
          description: apiEvent.description,
          event_type: apiEvent.event_type,
          event_type_display: apiEvent.event_type_display,
        });
        current.setDate(current.getDate() + 1);
      }
    });

    return eventsMap;
  }, [apiEvents]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(year, currentDate.getMonth() + 1, 0);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month trailing days
    for (let i = startWeekday - 1; i >= 0; i -= 1) {
      const date = new Date(year, currentDate.getMonth(), -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({ date: new Date(year, currentDate.getMonth(), day), isCurrentMonth: true });
    }

    // Next month leading days to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i += 1) {
      const date = new Date(year, currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentDate, month, year]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const todayKey = formatDateKey(new Date());
  const todayEvents = eventsByDate[todayKey] || [];

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Object.keys(eventsByDate)
      .filter((dateKey) => {
        const eventDate = new Date(dateKey);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort()
      .flatMap((dateKey) => eventsByDate[dateKey])
      .map((event) => ({
        ...event,
        formattedDate: new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      }));
  }, [eventsByDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activePath="/calendar" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userInitial={userInitial}
          userName={userProfile?.user?.first_name || userProfile?.user?.username}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
                <p className="text-gray-600">View your schedule and events</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatMonthYear(currentDate)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Panel */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-3 max-w-[560px] w-full">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <h2 className="text-sm font-semibold text-gray-900">{formatMonthYear(currentDate)}</h2>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading events...</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-7 text-[10px] font-semibold text-gray-500 mb-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map(({ date, isCurrentMonth }) => {
                        const dateKey = formatDateKey(date);
                        const isSelected = selectedDate === dateKey;
                        const isToday = dateKey === formatDateKey(new Date());
                        const hasEvents = Boolean(eventsByDate[dateKey]?.length);

                        return (
                          <button
                            key={dateKey}
                            onClick={() => setSelectedDate(dateKey)}
                            className={`
                              relative aspect-square rounded-md text-[11px] font-medium transition
                              ${isSelected ? 'bg-[#043276] text-white' : 'text-gray-900'}
                              ${!isCurrentMonth ? 'text-gray-300' : ''}
                              ${!isSelected ? 'hover:bg-gray-100' : ''}
                              ${isToday && !isSelected ? 'border border-[#043276]' : ''}
                            `}
                          >
                            {date.getDate()}
                            {hasEvents && (
                              <span
                                className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                                  isSelected ? 'bg-white' : 'bg-blue-500'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Upcoming Events */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {event.formattedDate}
                          </span>
                          {event.time && <span className="text-xs text-blue-600">{event.time}</span>}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No upcoming events.</div>
                )}
              </div>
            </div>

            {/* Selected Date Events */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDate ? formatSelectedDate(selectedDate) : 'Events'}
              </h2>
              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {event.event_type_display || event.event_type || 'Event'}
                        </span>
                        {event.time && <span className="text-xs text-gray-500">{event.time}</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-xs text-gray-600 line-clamp-3">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No events for this day.</div>
              )}
            </div>

            {/* Today Events (only if present) */}
            {todayEvents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Today</h2>
                <div className="flex flex-wrap gap-2">
                  {todayEvents.map((event) => (
                    <button
                      key={event.id}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-100"
                    >
                      {event.time ? `${event.time} • ` : ''}{event.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const formatSelectedDate = (dateKey: string) => {
  const date = new Date(dateKey);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (apiEvent: {
  start_time: string | null;
  is_all_day: boolean;
}) => {
  if (!apiEvent.start_time || apiEvent.is_all_day) {
    return undefined;
  }
  try {
    const timeDate = new Date(`2000-01-01T${apiEvent.start_time}`);
    return timeDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return apiEvent.start_time;
  }
};

export default Calendar;

