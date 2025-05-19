import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Payment {
  timestamp: Date;
  amount: number;
  type: string;
}

interface PaymentCalendarProps {
  payments: Payment[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const PaymentCalendar: React.FC<PaymentCalendarProps> = ({ 
  payments, 
  selectedDate, 
  onSelectDate 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{
    date: Date;
    isCurrentMonth: boolean;
    hasPayments: boolean;
    paymentCount: number;
    totalAmount: number;
  }>>([]);

  // Generate calendar days for the current month view
  useEffect(() => {
    const generateCalendarDays = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      
      // Day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
      const firstDayOfWeek = firstDay.getDay();
      
      // Generate array of days to display in the calendar
      const days = [];
      
      // Add days from previous month to fill the first week
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i);
        days.push({
          date,
          isCurrentMonth: false,
          hasPayments: hasPaymentsOnDate(date),
          paymentCount: getPaymentCountForDate(date),
          totalAmount: getTotalAmountForDate(date)
        });
      }
      
      // Add days from current month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        days.push({
          date,
          isCurrentMonth: true,
          hasPayments: hasPaymentsOnDate(date),
          paymentCount: getPaymentCountForDate(date),
          totalAmount: getTotalAmountForDate(date)
        });
      }
      
      // Fill remaining days of the last week with days from next month
      const remainingDays = 7 - (days.length % 7);
      if (remainingDays < 7) {
        for (let day = 1; day <= remainingDays; day++) {
          const date = new Date(year, month + 1, day);
          days.push({
            date,
            isCurrentMonth: false,
            hasPayments: hasPaymentsOnDate(date),
            paymentCount: getPaymentCountForDate(date),
            totalAmount: getTotalAmountForDate(date)
          });
        }
      }
      
      setCalendarDays(days);
    };
    
    generateCalendarDays();
  }, [currentMonth, payments]);

  const hasPaymentsOnDate = (date: Date) => {
    // Check if there are any payments on this date
    return payments.some(payment => {
      const paymentDate = payment.timestamp instanceof Date ? 
        payment.timestamp : 
        new Date(payment.timestamp);
        
      return (
        paymentDate.getDate() === date.getDate() &&
        paymentDate.getMonth() === date.getMonth() &&
        paymentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPaymentCountForDate = (date: Date) => {
    // Count payments on this date
    return payments.filter(payment => {
      const paymentDate = payment.timestamp instanceof Date ? 
        payment.timestamp : 
        new Date(payment.timestamp);
        
      return (
        paymentDate.getDate() === date.getDate() &&
        paymentDate.getMonth() === date.getMonth() &&
        paymentDate.getFullYear() === date.getFullYear()
      );
    }).length;
  };

  const getTotalAmountForDate = (date: Date) => {
    // Sum payment amounts on this date
    return payments.reduce((total, payment) => {
      const paymentDate = payment.timestamp instanceof Date ? 
        payment.timestamp : 
        new Date(payment.timestamp);
        
      if (
        paymentDate.getDate() === date.getDate() &&
        paymentDate.getMonth() === date.getMonth() &&
        paymentDate.getFullYear() === date.getFullYear()
      ) {
        return total + (parseFloat(payment.amount) || 0);
      }
      return total;
    }, 0);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onSelectDate(new Date());
  };

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => (
          <button
            key={index}
            className={`
              relative h-24 sm:h-28 p-1 bg-white hover:bg-gray-50 focus:z-10 focus:outline-none
              ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
              ${isSelectedDate(day.date) ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
              ${isToday(day.date) && !isSelectedDate(day.date) ? 'border border-blue-500' : ''}
            `}
            onClick={() => onSelectDate(day.date)}
          >
            <time
              dateTime={day.date.toISOString().split('T')[0]}
              className={`
                ml-1 flex h-6 w-6 items-center justify-center rounded-full 
                ${
                  isSelectedDate(day.date)
                    ? 'bg-blue-600 font-semibold text-white'
                    : isToday(day.date)
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-900'
                }
              `}
            >
              {day.date.getDate()}
            </time>
            
            {day.hasPayments && (
              <div className="mt-1">
                <div className={`
                  w-full text-xs px-1 py-0.5 rounded-sm font-medium
                  ${day.isCurrentMonth ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                `}>
                  {day.paymentCount} {day.paymentCount === 1 ? 'payment' : 'payments'}
                </div>
                
                <div className={`
                  mt-1 w-full text-xs px-1 py-0.5 rounded-sm font-medium
                  ${day.isCurrentMonth ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                `}>
                  ₹{day.totalAmount.toFixed(0)}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentCalendar;