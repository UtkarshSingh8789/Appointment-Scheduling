import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { formatDate } from '@/utils';
import { getProviderImage } from '@/utils/providerImages';
import type { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
}

/** Displays a single review with customer info, rating, and comment */
export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
      <div className="flex items-start gap-3">
        <Avatar
          name={review.customer?.full_name || 'Customer'}
          src={getProviderImage(review.customer?.id || 'customer')}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {review.customer?.full_name || 'Anonymous'}
            </p>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {formatDate(review.created_at)}
            </span>
          </div>
          <div className="mt-1">
            <StarRating value={review.rating} readonly size="sm" />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
