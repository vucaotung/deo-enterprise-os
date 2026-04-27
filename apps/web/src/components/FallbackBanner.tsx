import { AlertCircle } from 'lucide-react';

export const FallbackBanner = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
      <AlertCircle size={16} />
      <span>Đang hiển thị dữ liệu mẫu — chưa có dữ liệu thật hoặc API offline.</span>
    </div>
  );
};
