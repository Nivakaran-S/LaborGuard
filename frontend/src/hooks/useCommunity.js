/**
 * useCommunity.js
 *
 * FIXES:
 *  - useGetPosts: was GET /posts (no route) → now getFeed(userId)
 *  - useGetPolls: was returning HARDCODED MOCK DATA → now filters real feed posts
 *  - votePoll: was crashing CommunityFeedPage → now calls communityApi.votePoll()
 *  - All 15 missing hooks/mutations added
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communityApi } from "@/api/communityApi";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export const useCommunity = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // ── Queries ──────────────────────────────────────────────────────────────

    // [FIX] was GET /posts — no such route. Now uses getFeed(userId)
    const useGetPosts = (params = {}) => useQuery({
        queryKey: ['community-feed', user?.userId, params],
        queryFn: async () => {
            if (!user?.userId) return [];
            const res = await communityApi.getFeed(user.userId, params.page, params.limit);
            return res.data || [];
        },
        enabled: !!user?.userId,
    });

    const useGetFeed = useGetPosts; // alias

    const useGetTrending = (page = 1) => useQuery({
        queryKey: ['community-trending', page],
        queryFn: async () => {
            const res = await communityApi.getTrendingFeed(page);
            return res.data || [];
        },
    });

    // [FIX] was returning hardcoded mock data — now filters real posts with polls
    const useGetPolls = () => useQuery({
        queryKey: ['community-polls', user?.userId],
        queryFn: async () => {
            if (!user?.userId) return [];
            const res = await communityApi.getFeed(user.userId, 1, 50);
            const posts = res.data || [];
            return posts.filter(p => p.poll && p.poll.options?.length > 0);
        },
        enabled: !!user?.userId,
    });

    const useSearchByHashtag = (tag, page = 1) => useQuery({
        queryKey: ['community-hashtag', tag, page],
        queryFn: async () => {
            if (!tag) return [];
            const res = await communityApi.searchByHashtag(tag, page);
            return res.data || [];
        },
        enabled: !!tag,
    });

    const useGetComments = (postId, page = 1) => useQuery({
        queryKey: ['community-comments', postId, page],
        queryFn: async () => {
            const res = await communityApi.getComments(postId, page);
            return res.data || [];
        },
        enabled: !!postId,
    });

    const useGetProfile = (userId) => useQuery({
        queryKey: ['community-profile', userId],
        queryFn: async () => {
            const res = await communityApi.getProfile(userId);
            return res.data;
        },
        enabled: !!userId,
    });

    const useGetBookmarks = (page = 1) => useQuery({
        queryKey: ['community-bookmarks', user?.userId, page],
        queryFn: async () => {
            if (!user?.userId) return [];
            const res = await communityApi.getBookmarks(user.userId, page);
            return res.data || [];
        },
        enabled: !!user?.userId,
    });

    const useGetStatuses = () => useQuery({
        queryKey: ['community-statuses', user?.userId],
        queryFn: async () => {
            if (!user?.userId) return [];
            const res = await communityApi.getStatuses(user.userId);
            return res.data || [];
        },
        enabled: !!user?.userId,
    });

    // ── Mutations ────────────────────────────────────────────────────────────

    const createPost = useMutation({
        mutationFn: (formData) => communityApi.createPost(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            toast.success("Post shared with the community!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to create post"),
    });

    const deletePost = useMutation({
        mutationFn: (postId) => communityApi.deletePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            toast.success("Post deleted");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to delete post"),
    });

    const likePost = useMutation({
        mutationFn: (postId) => communityApi.likePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            queryClient.invalidateQueries({ queryKey: ['community-trending'] });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to like post"),
    });

    const sharePost = useMutation({
        mutationFn: (postId) => communityApi.sharePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            toast.success("Post shared!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to share post"),
    });

    // [FIX] was crashing CommunityFeedPage — votePoll was missing everywhere
    const votePoll = useMutation({
    mutationFn: ({ postId, pollId, optionIndex }) =>
        communityApi.votePoll(postId ?? pollId, optionIndex),  
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            queryClient.invalidateQueries({ queryKey: ['community-polls'] });
            toast.success("Vote recorded!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to vote"),
    });

    const reportPost = useMutation({
        mutationFn: ({ postId, reason }) => communityApi.reportPost(postId, reason),
        onSuccess: () => toast.success("Post reported. Our team will review it."),
        onError: (err) => toast.error(err.response?.data?.message || "Failed to report post"),
    });

    const addComment = useMutation({
        mutationFn: ({ postId, content }) => communityApi.addComment(postId, content),
        onSuccess: (_, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
            toast.success("Comment added!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to add comment"),
    });

    const deleteComment = useMutation({
        mutationFn: ({ commentId, postId }) => communityApi.deleteComment(commentId),
        onSuccess: (_, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
            toast.success("Comment deleted");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to delete comment"),
    });

    const followUser = useMutation({
        mutationFn: (targetUserId) => communityApi.followUser(targetUserId),
        onSuccess: (_, targetUserId) => {
            queryClient.invalidateQueries({ queryKey: ['community-profile', targetUserId] });
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            toast.success("Now following!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to follow user"),
    });

    const unfollowUser = useMutation({
        mutationFn: (targetUserId) => communityApi.unfollowUser(targetUserId),
        onSuccess: (_, targetUserId) => {
            queryClient.invalidateQueries({ queryKey: ['community-profile', targetUserId] });
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            toast.success("Unfollowed");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to unfollow"),
    });

    const toggleBookmark = useMutation({
        mutationFn: (postId) => communityApi.toggleBookmark(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-bookmarks'] });
            toast.success("Bookmarks updated!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update bookmark"),
    });

    const createStatus = useMutation({
        mutationFn: (formData) => communityApi.createStatus(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-statuses'] });
            toast.success("Status posted!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to post status"),
    });

    const deleteStatus = useMutation({
        mutationFn: (statusId) => communityApi.deleteStatus(statusId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-statuses'] });
            toast.success("Status deleted");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to delete status"),
    });

    return {
        // Queries
        useGetPosts, useGetFeed, useGetTrending, useGetPolls,
        useSearchByHashtag, useGetComments, useGetProfile,
        useGetBookmarks, useGetStatuses,
        // Mutations
        createPost, deletePost, likePost, sharePost,
        votePoll, reportPost, addComment, deleteComment,
        followUser, unfollowUser, toggleBookmark,
        createStatus, deleteStatus,
    };
};