"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import type { SitePost } from "@/lib/site-connector";
import { RichContent, formatRichHtml } from "@/components/shared/rich-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadFromStorage, saveToStorage, storageKeys } from "@/lib/local-storage";
import type { User } from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_MASTER_PANEL_URL ||
  process.env.NEXT_PUBLIC_MASTER_API_URL;
const SITE_CODE = process.env.NEXT_PUBLIC_SITE_CODE;
const LOCAL_COMMENT_VERSION = "v2";
const DAILY_COMMENT_LIMIT = 10;

type LocalComment = {
  id: string;
  slug: string;
  articleSlug: string;
  authorName: string;
  body: string;
  createdAt: string;
  source: "local";
};

type DisplayComment = {
  id: string;
  slug: string;
  authorName: string;
  body: string;
  createdAt: string;
  source: "local" | "remote";
};

const buildPublicUrl = (path: string) => {
  if (!API_BASE || !SITE_CODE) return null;
  return `${API_BASE.replace(/\/$/, "")}/api/v1/public/${SITE_CODE}${path}`;
};

const getContent = (post: SitePost) =>
  post.content && typeof post.content === "object" ? (post.content as Record<string, any>) : {};

const commentStorageKey = (slug: string) => `nexus-article-comments:${LOCAL_COMMENT_VERSION}:${slug}`;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const nextResetTime = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getLocalAuthorName = () => {
  const savedUser = loadFromStorage<User | null>(storageKeys.user, null);
  return savedUser?.name?.trim() || "User";
};

const toDisplayComment = (comment: SitePost): DisplayComment => {
  const content = getContent(comment);
  return {
    id: comment.id,
    slug: comment.slug,
    authorName: comment.authorName || "Anonymous",
    body:
      (typeof content.description === "string" && content.description) ||
      comment.summary ||
      "Comment added.",
    createdAt: comment.publishedAt || comment.createdAt || new Date().toISOString(),
    source: "remote",
  };
};

const sortComments = (comments: DisplayComment[]) =>
  [...comments].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === "local" ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

export function ArticleComments({ slug }: { slug: string }) {
  const [remoteComments, setRemoteComments] = useState<DisplayComment[]>([]);
  const [localComments, setLocalComments] = useState<LocalComment[]>([]);
  const [page, setPage] = useState(1);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const saved = loadFromStorage<LocalComment[]>(commentStorageKey(slug), []);
    setLocalComments(Array.isArray(saved) ? saved : []);
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      const target = buildPublicUrl("/feed?limit=200");
      if (!target) {
        setRemoteComments([]);
        return;
      }

      try {
        const response = await fetch(target, { cache: "no-store" });
        if (!response.ok) {
          setRemoteComments([]);
          return;
        }
        const json = (await response.json()) as { data?: { posts?: SitePost[] } };
        const posts = json.data?.posts || [];
        const filtered = posts.filter((post) => {
          const content = getContent(post);
          return (
            content.type === "comment" &&
            (content.articleSlug === slug ||
              (typeof content.parentUrl === "string" && content.parentUrl.includes(`/${slug}`)))
          );
        });

        setRemoteComments(filtered.map(toDisplayComment));
      } catch {
        setRemoteComments([]);
      }
    };

    load();
  }, [slug]);

  const mergedComments = useMemo(
    () =>
      sortComments([
        ...localComments.map((comment) => ({
          id: comment.id,
          slug: comment.slug,
          authorName: comment.authorName,
          body: comment.body,
          createdAt: comment.createdAt,
          source: "local" as const,
        })),
        ...remoteComments,
      ]),
    [localComments, remoteComments]
  );

  const commentsToday = useMemo(() => {
    const todayStart = startOfToday();
    return localComments.filter((comment) => new Date(comment.createdAt).getTime() >= todayStart).length;
  }, [localComments]);

  const remainingToday = Math.max(DAILY_COMMENT_LIMIT - commentsToday, 0);
  const limitReached = remainingToday <= 0;
  const resetLabel = nextResetTime().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#comment-")) {
      const targetKey = hash.replace("#comment-", "");
      const match = mergedComments.find(
        (item) => item.id === targetKey || item.slug === targetKey
      );
      setHighlightId(match?.id || null);
      return;
    }

    if (hash === "#comment" && mergedComments.length) {
      setHighlightId(mergedComments[0].id);
      return;
    }

    setHighlightId(null);
  }, [mergedComments]);

  useEffect(() => {
    if (!highlightId) return;
    const target = document.getElementById(`comment-${highlightId}`);
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }, [highlightId]);

  const totalPages = Math.max(Math.ceil(mergedComments.length / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const visibleComments = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return mergedComments.slice(start, start + pageSize);
  }, [mergedComments, safePage]);

  const persistLocalComments = (nextComments: LocalComment[]) => {
    setLocalComments(nextComments);
    saveToStorage(commentStorageKey(slug), nextComments);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanBody = commentBody.trim();

    if (!cleanBody) {
      setFormError("Please write a comment before publishing.");
      return;
    }

    if (limitReached) {
      setFormError("You have reached the 10 comments per day limit on this device.");
      return;
    }

    const nextComment: LocalComment = {
      id: `local-${slug}-${Date.now()}`,
      slug: `local-comment-${Date.now()}`,
      articleSlug: slug,
      authorName: getLocalAuthorName(),
      body: cleanBody,
      createdAt: new Date().toISOString(),
      source: "local",
    };

    persistLocalComments([nextComment, ...localComments]);
    setCommentBody("");
    setFormError(null);
    setHighlightId(nextComment.id);
    setPage(1);
  };

  const handleDeleteLocalComment = (commentId: string) => {
    const nextComments = localComments.filter((comment) => comment.id !== commentId);
    persistLocalComments(nextComments);
    if (highlightId === commentId) {
      setHighlightId(null);
    }
    setFormError(null);
  };

  return (
    <section className="mt-12 relative" id="comments">
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-[#fcfaf6] via-[#f8f3ea] to-[#f2eadd] opacity-90"></div>
      <div className="absolute inset-0 rounded-[3rem] border border-[#e7dfd2] opacity-70"></div>
      
      <div className="relative">
        {/* Fun header with animations */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#d4b25c] rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-[#b98970] rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-[#8f1f3f] rounded-full animate-pulse delay-150"></div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-[#8f1f3f]" />
            <h2 className="text-3xl font-bold text-[#2f241d]">
              Creative Comments Hub
            </h2>
            <span className="text-2xl">💬</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-[#8f1f3f] rounded-full animate-pulse delay-300"></div>
            <div className="w-3 h-3 bg-[#b98970] rounded-full animate-pulse delay-500"></div>
            <div className="w-3 h-3 bg-[#d4b25c] rounded-full animate-pulse delay-700"></div>
          </div>
        </div>

        {/* Creative comment form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="rounded-[2.5rem] border-2 border-dashed border-[#dccfbd] bg-[#fcfaf6] p-6 shadow-[0_12px_35px_rgba(82,56,37,0.08)] backdrop-blur-sm transition-all duration-300">
            {/* Fun form header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <label htmlFor="comment-body" className="text-lg font-bold text-[#3f3127]">
                Share Your Creative Thoughts!
              </label>
              <span className="text-2xl">🎨</span>
            </div>
            
            <Textarea
              id="comment-body"
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="🌟 Let your creativity shine! What do you think about this article?"
              className="min-h-32 rounded-2xl border-2 border-dotted border-[#d9cdbd] bg-[#fffdf9] text-[#3f3127] placeholder-[#8f7564] font-medium focus:border-[#b98970] focus:ring-4 focus:ring-[#eadfce] transition-all duration-300"
              maxLength={2000}
              disabled={limitReached}
            />
            
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-bold border-2 ${
                    limitReached
                      ? "bg-red-100 text-red-700 border-red-300 animate-pulse"
                      : remainingToday <= 3
                        ? "bg-amber-100 text-amber-700 border-amber-300 animate-bounce"
                        : "bg-[#8f1f3f] text-[#fff6ef] border-[#7b1b36] shadow-lg"
                  }`}
                >
                  {limitReached ? (
                    <span>🚀 Daily limit reached! {DAILY_COMMENT_LIMIT}/{DAILY_COMMENT_LIMIT}</span>
                  ) : (
                    <span>✨ {remainingToday} creative comments left today!</span>
                  )}
                </div>
                <p className="text-xs text-[#6f5648] font-medium">
                  {limitReached ? (
                    <span>🕐 Come back after {resetLabel} for more creative fun!</span>
                  ) : (
                    <span>🔄 Your creative energy resets at {resetLabel}</span>
                  )}
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={limitReached}
                className="rounded-full px-6 py-3 bg-[#8f1f3f] text-[#fff6ef] font-bold shadow-lg hover:bg-[#7b1b36] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="mr-2">🪄</span>
                Publish Creative Comment
              </Button>
            </div>
            {formError ? (
              <div className="mt-4 p-3 rounded-2xl bg-red-100 border-2 border-red-300 text-red-700 font-medium animate-pulse">
                <span className="mr-2">⚠️</span>
                {formError}
              </div>
            ) : null}
          </div>
        </form>
      </div>

      {mergedComments.length ? (
        <div className="mt-8 space-y-6">
          {visibleComments.map((comment, index) => {
            const isHighlighted = highlightId === comment.id;
            return (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className={`relative transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 ${
                  isHighlighted ? "scale-105 -translate-y-2" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Creative comment card */}
                <div className={`rounded-[2rem] border-2 p-6 backdrop-blur-sm shadow-xl ${
                  isHighlighted 
                    ? "border-[#b98970] bg-[#f7efe3]" 
                    : comment.source === "local" 
                      ? "border-[#dccfbd] bg-[#fcfaf6] hover:border-[#b98970]"
                      : "border-[#e3d8cb] bg-[#f8f3ea] hover:border-[#b98970]"
                }`}>
                  {/* Comment header with creative elements */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#8f1f3f] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#2f241d]">{comment.authorName}</p>
                        <div className="flex items-center gap-2">
                          {comment.source === "local" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-[#8f1f3f] text-[#fff6ef] rounded-full">
                              <span>🌟</span>
                              Creative Author
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-[#6f5648] text-[#fff6ef] rounded-full">
                              <span>💫</span>
                              Guest Comment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {comment.source === "local" ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteLocalComment(comment.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-300 text-red-500 transition hover:bg-red-100 hover:scale-110 hover:rotate-12"
                          aria-label="Delete local comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Comment content with creative styling */}
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 text-2xl opacity-20">💬</div>
                    <RichContent
                      html={formatRichHtml(comment.body, "Comment added.")}
                      className="text-[#3f3127] font-medium leading-relaxed prose prose-p:text-[#4d3d31] prose-p:font-medium prose-strong:text-[#2f241d] prose-em:text-[#6f5648]"
                    />
                    <div className="absolute -bottom-2 -right-2 text-2xl opacity-20">✨</div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#d4b25c] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#b98970] rounded-full animate-pulse delay-75"></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 relative">
          <div className="rounded-[2.5rem] border-2 border-dashed border-[#dccfbd] bg-[#fcfaf6] p-8 text-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl animate-bounce">💭</div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-[#2f241d]">No Creative Comments Yet!</p>
                <p className="text-[#6f5648] font-medium">Be the first to share your amazing thoughts! 🌟</p>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 bg-[#d4b25c] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[#b98970] rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-[#8f1f3f] rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 relative">
          <div className="rounded-[2rem] border-2 border-dashed border-[#dccfbd] bg-[#fcfaf6] p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <div className="text-lg font-bold text-[#2f241d]">
                  Reading Page <span className="text-2xl text-[#8f1f3f]">{safePage}</span> of <span className="text-2xl text-[#b98970]">{totalPages}</span>
                </div>
                <span className="text-2xl">📚</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={safePage === 1}
                  className="group relative rounded-full border-2 border-[#7b1b36] bg-[#8f1f3f] px-4 py-2 text-sm font-bold text-[#fff6ef] shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:-translate-y-0"
                >
                  <span className="flex items-center gap-2">
                    <span>←</span>
                    <span>Previous</span>
                    <span className="text-lg">📖</span>
                  </span>
                  <div className="absolute inset-0 rounded-full bg-[#7b1b36] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-[#d4b25c] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#b98970] rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-[#8f1f3f] rounded-full animate-pulse delay-150"></div>
                </div>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={safePage === totalPages}
                  className="group relative rounded-full border-2 border-[#9b775b] bg-[#b98970] px-4 py-2 text-sm font-bold text-[#fff6ef] shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:-translate-y-0"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <span>Next</span>
                    <span>→</span>
                  </span>
                  <div className="absolute inset-0 rounded-full bg-[#9b775b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
            
            {/* Page indicators */}
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    pageNum === safePage
                      ? "bg-[#8f1f3f] scale-125 shadow-lg"
                      : "bg-[#ddcfbf] hover:bg-[#cdb9a3] hover:scale-110"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
