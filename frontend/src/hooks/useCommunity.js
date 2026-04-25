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

    // ── Phase 2 additions ────────────────────────────────────────────────────
    const useGetPostLikers = (postId) => useQuery({
        queryKey: ['community-likers', postId],
        queryFn: async () => {
            const res = await communityApi.getPostLikers(postId);
            return res.data || [];
        },
        enabled: !!postId,
    });

    const useGetPostsByAuthor = (userId, page = 1) => useQuery({
        queryKey: ['community-author-posts', userId, page],
        queryFn: async () => {
            const res = await communityApi.getPostsByAuthor(userId, page);
            return res.data || [];
        },
        enabled: !!userId,
    });

    const useGetProfileStats = (userId) => useQuery({
        queryKey: ['community-profile-stats', userId],
        queryFn: async () => {
            const res = await communityApi.getProfileStats(userId);
            return res.data;
        },
        enabled: !!userId,
    });

    const useSearchPosts = (q, page = 1) => useQuery({
        queryKey: ['community-search-posts', q, page],
        queryFn: async () => {
            if (!q || q.length < 2) return [];
            const res = await communityApi.searchPosts(q, page);
            return res.data || [];
        },
        enabled: !!q && q.length >= 2,
    });

    const useSearchProfiles = (q, role) => useQuery({
        queryKey: ['community-search-profiles', q, role],
        queryFn: async () => {
            if (!q || q.length < 2) return [];
            const res = await communityApi.searchProfiles(q, role);
            return res.data || [];
        },
        enabled: !!q && q.length >= 2,
    });

    const useGetFollowRequests = () => useQuery({
        queryKey: ['community-follow-requests'],
        queryFn: async () => {
            const res = await communityApi.getIncomingFollowRequests();
            return res.data || [];
        },
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
        onSuccess: (_, postId) => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            queryClient.invalidateQueries({ queryKey: ['community-trending'] });
            queryClient.invalidateQueries({ queryKey: ['community-likers', postId] });
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to like post"),
    });

    const editPost = useMutation({
        mutationFn: ({ postId, formData }) => communityApi.updatePost(postId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-feed'] });
            queryClient.invalidateQueries({ queryKey: ['community-trending'] });
            queryClient.invalidateQueries({ queryKey: ['community-author-posts'] });
            toast.success("Post updated");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update post"),
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
        mutationFn: ({ postId, content, parentCommentId }) =>
            communityApi.addComment(postId, content, parentCommentId),
        onSuccess: (_, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
            toast.success("Comment added!");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to add comment"),
    });

    const editComment = useMutation({
        mutationFn: ({ commentId, content }) => communityApi.updateComment(commentId, content),
        onSuccess: (_, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
            toast.success("Comment updated");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to update comment"),
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

    const approveFollowRequest = useMutation({
        mutationFn: (requestId) => communityApi.approveFollowRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-follow-requests'] });
            queryClient.invalidateQueries({ queryKey: ['community-profile'] });
            toast.success("Follow request approved");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to approve request"),
    });

    const rejectFollowRequest = useMutation({
        mutationFn: (requestId) => communityApi.rejectFollowRequest(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-follow-requests'] });
            toast.success("Follow request rejected");
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to reject request"),
    });

    return {
        // Queries
        useGetPosts, useGetFeed, useGetTrending, useGetPolls,
        useSearchByHashtag, useGetComments, useGetProfile,
        useGetBookmarks, useGetStatuses,
        useGetPostLikers, useGetPostsByAuthor, useGetProfileStats,
        useSearchPosts, useSearchProfiles, useGetFollowRequests,
        // Mutations
        createPost, deletePost, editPost, likePost, sharePost,
        votePoll, reportPost, addComment, editComment, deleteComment,
        followUser, unfollowUser, toggleBookmark,
        createStatus, deleteStatus,
        approveFollowRequest, rejectFollowRequest,
    };
};