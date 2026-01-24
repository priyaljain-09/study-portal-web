import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setShowToast } from '../../redux/slices/applicationSlice';
import { CheckCircle2, XCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const validAlertTypes = ['success', 'error', 'warning', 'info', 'primary'] as const;
type AlertType = (typeof validAlertTypes)[number];

const Toast = () => {
  const dispatch = useAppDispatch();
  const { showToast, toastMessage, type } = useAppSelector((state) => state.applicationData);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const alertType: AlertType = validAlertTypes.includes(type as AlertType)
    ? (type as AlertType)
    : 'info';

  const getBackgroundColor = (type: AlertType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'primary':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getIcon = (type: AlertType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'primary':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    if (showToast) {
      setIsVisible(true);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          dispatch(
            setShowToast({
              show: false,
              toastMessage: '',
              type: '',
            })
          );
        }, 300); // Wait for fade out animation
      }, 3000); // Show for 3 seconds

      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [showToast, dispatch]);

  if (!isVisible && !showToast) return null;

  return (
    <div
      className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isAnimating && showToast
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div
        className={`${getBackgroundColor(alertType)} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px]`}
      >
        <div className="flex-shrink-0">{getIcon(alertType)}</div>
        <p className="text-sm font-medium flex-1 text-center">{toastMessage}</p>
      </div>
    </div>
  );
};

export default Toast;

