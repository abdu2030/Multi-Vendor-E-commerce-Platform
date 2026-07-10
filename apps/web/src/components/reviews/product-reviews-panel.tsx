"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AlertCircle, BadgeCheck, MessageSquare, RefreshCw, Star } from "@/components/imported/design-icons";
import { createProductReview, getProductReviews, ProductReview } from "@/lib/reviews";

type ProductReviewsPanelProps = {
  productId: string;
  productTitle: string;
  compact?: boolean;
  showList?: boolean;
};

type FormState = {
  rating: number;
  comment: string;
  imageUrls: string;
};

const initialForm: FormState = {
  rating: 5,
  comment: "",
  imageUrls: ""
};

export function ProductReviewsPanel({
  productId,
  productTitle,
  compact = false,
  showList = true
}: ProductReviewsPanelProps) {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(showList);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!showList) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProductReviews(productId);
      setReviews(response.reviews);
      setAverageRating(response.product.averageRating);
      setReviewCount(response.product.reviewCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reviews could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, showList]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const imageUrls = useMemo(() => parseImageUrls(form.imageUrls), [form.imageUrls]);
  const validationError = validateReviewForm(form.comment, imageUrls);
  const displayedValidationError = form.comment || form.imageUrls ? validationError : null;

  const handleSubmit = async () => {
    if (!accessToken || validationError || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const created = await createProductReview(accessToken, productId, {
        rating: form.rating,
        comment: form.comment.trim(),
        images: imageUrls
      });

      setForm(initialForm);
      setMessage("Review posted.");

      if (showList) {
        setReviews((current) => [created, ...current.filter((review) => review.id !== created.id)]);
        setReviewCount((current) => current + 1);
        setAverageRating((current) => {
          const total = current * reviewCount + created.rating;
          return Number((total / (reviewCount + 1)).toFixed(2));
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review could not be posted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={compact ? "rounded-2xl border border-stone-200 bg-stone-50 p-4" : "rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Verified reviews</p>
          <h2 className={compact ? "mt-1 text-lg font-extrabold text-stone-950" : "mt-2 text-2xl font-extrabold tracking-tight text-stone-950"}>
            {compact ? `Review ${productTitle}` : "Customer feedback"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Only buyers with a paid order for this product can post a review.
          </p>
        </div>
        {showList ? (
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-800">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
            <div>
              <p className="text-lg font-extrabold">{averageRating.toFixed(1)}</p>
              <p className="text-xs font-bold">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</p>
            </div>
          </div>
        ) : null}
      </div>

      <ReviewForm
        authLoading={authLoading}
        error={error}
        form={form}
        hasSession={Boolean(accessToken)}
        isSubmitting={isSubmitting}
        message={message}
        onChange={setForm}
        onSubmit={() => void handleSubmit()}
        validationError={validationError}
        displayedValidationError={displayedValidationError}
      />

      {showList ? (
        <div className={compact ? "mt-5" : "mt-8"}>
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-extrabold text-stone-600">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
              Loading reviews
            </div>
          ) : reviews.length ? (
            <div className="grid gap-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-5 text-sm font-bold text-stone-500">
              No reviews yet.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ReviewForm({
  authLoading,
  error,
  form,
  hasSession,
  isSubmitting,
  message,
  onChange,
  onSubmit,
  validationError,
  displayedValidationError
}: {
  authLoading: boolean;
  error: string | null;
  form: FormState;
  hasSession: boolean;
  isSubmitting: boolean;
  message: string | null;
  onChange: (form: FormState) => void;
  onSubmit: () => void;
  validationError: string | null;
  displayedValidationError: string | null;
}) {
  if (authLoading) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-extrabold text-stone-600">
        <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
        Checking review access
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 h-5 w-5 text-emerald-700" />
          <p className="text-sm font-bold leading-6 text-stone-600">Sign in with the buyer account used for checkout to write a verified review.</p>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-extrabold text-white transition hover:bg-stone-800" href="/login">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-stone-950">Your review</p>
          <p className="mt-1 text-xs font-bold text-stone-500">Rating, comment, and optional image URLs.</p>
        </div>
        <StarRatingInput value={form.rating} onChange={(rating) => onChange({ ...form, rating })} />
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500">Comment</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-stone-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          maxLength={1000}
          minLength={10}
          onChange={(event) => onChange({ ...form, comment: event.target.value })}
          placeholder="What should other buyers know?"
          value={form.comment}
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-extrabold uppercase tracking-widest text-stone-500">Image URLs</span>
        <input
          className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          onChange={(event) => onChange({ ...form, imageUrls: event.target.value })}
          placeholder="Optional, comma separated"
          value={form.imageUrls}
        />
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusMessage error={error ?? displayedValidationError} message={message} />
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
          disabled={Boolean(validationError) || isSubmitting}
          onClick={onSubmit}
          type="button"
        >
          {isSubmitting ? "Posting..." : "Post review"}
          <BadgeCheck className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Review rating">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          aria-checked={value === rating}
          aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-amber-500 transition hover:bg-amber-50"
          key={rating}
          onClick={() => onChange(rating)}
          role="radio"
          type="button"
        >
          <Star className={`h-5 w-5 ${rating <= value ? "fill-amber-400" : "fill-transparent text-stone-300"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-extrabold text-stone-950">{review.buyer.fullName}</p>
            {review.verifiedPurchase ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-bold text-stone-500">{formatReviewDate(review.createdAt)}</p>
        </div>
        <Stars value={review.rating} />
      </div>
      <p className="mt-3 text-sm font-semibold leading-7 text-stone-600">{review.comment}</p>
      {review.images.length ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.images.map((image) => (
            <img className="h-16 w-16 rounded-2xl object-cover" key={image} src={image} alt="Review image" />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <Star className={`h-4 w-4 ${rating <= value ? "fill-amber-400 text-amber-500" : "text-stone-300"}`} key={rating} />
      ))}
    </div>
  );
}

function StatusMessage({ error, message }: { error: string | null; message: string | null }) {
  if (error) {
    return (
      <p className="flex items-start gap-2 text-sm font-bold text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        {error}
      </p>
    );
  }

  if (message) {
    return <p className="text-sm font-extrabold text-emerald-700">{message}</p>;
  }

  return <p className="text-xs font-bold text-stone-500">Reviews publish after verified purchase checks pass.</p>;
}

function parseImageUrls(value: string) {
  return value
    .split(/[,\n]/)
    .map((image) => image.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function validateReviewForm(comment: string, imageUrls: string[]) {
  const trimmed = comment.trim();

  if (trimmed.length < 10) {
    return "Comment must be at least 10 characters.";
  }

  if (trimmed.length > 1000) {
    return "Comment must be 1000 characters or less.";
  }

  const invalidUrl = imageUrls.find((image) => !isValidUrl(image));

  if (invalidUrl) {
    return `Invalid image URL: ${invalidUrl}`;
  }

  return null;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
