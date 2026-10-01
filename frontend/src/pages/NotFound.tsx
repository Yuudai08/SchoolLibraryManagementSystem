import React from 'react';
import { Link } from 'react-router-dom';
import { BookX, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200/90 flex items-center justify-center text-stone-700 shadow-soft mb-5">
        <BookX className="w-8 h-8 stroke-[1.75]" />
      </div>
      <p className="text-xs font-semibold text-brand-600 font-mono tracking-wider">ERROR 404</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
        Catalog Record Not Found
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-stone-500 max-w-md leading-relaxed">
        The archive section or page you requested could not be located in the library catalog. Please verify the URL or return to operations.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/circulation">
          <Button variant="outline" size="md" leftIcon={<ArrowLeftRight className="w-4 h-4" />}>
            Circulation Desk
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
