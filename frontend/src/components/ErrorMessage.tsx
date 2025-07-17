import { getErrorMessage } from '@/lib/error-handler';

type Props = {
  error?: string | null | unknown;
};

export const ErrorMessage: React.FC<Props> = ({ error }) => {
  const msg = getErrorMessage(error);
  if (!msg) return null;
  return (
    <div className="text-red-500 text-sm mt-1" role="alert">
      {msg}
    </div>
  );
};
