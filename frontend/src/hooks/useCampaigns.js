import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/api/campaignsApi';
import { toast } from 'sonner';

export const useCampaigns = () => {
  const queryClient = useQueryClient();

  const useGetCampaigns = (filters = {}) =>
    useQuery({
      queryKey: ['campaigns', filters],
      queryFn: async () => {
        const res = await campaignsApi.list(filters);
        return res.data || [];
      },
    });

  const useGetCampaign = (id) =>
    useQuery({
      queryKey: ['campaign', id],
      queryFn: async () => {
        const res = await campaignsApi.get(id);
        return res.data;
      },
      enabled: !!id,
    });

  const useGetCampaignSupporters = (id) =>
    useQuery({
      queryKey: ['campaign-supporters', id],
      queryFn: async () => {
        const res = await campaignsApi.supporters(id);
        return res.data || [];
      },
      enabled: !!id,
    });

  const useGetCampaignUpdates = (id) =>
    useQuery({
      queryKey: ['campaign-updates', id],
      queryFn: async () => {
        const res = await campaignsApi.updates(id);
        return res.data || [];
      },
      enabled: !!id,
    });

  const createCampaign = useMutation({
    mutationFn: (formData) => campaignsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created!');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to create campaign'),
  });

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }) => campaignsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success('Campaign updated');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to update campaign'),
  });

  const deleteCampaign = useMutation({
    mutationFn: (id) => campaignsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign archived');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to archive campaign'),
  });

  const supportCampaign = useMutation({
    mutationFn: (id) => campaignsApi.support(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-supporters', id] });
      toast.success('Supporting this campaign');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to support'),
  });

  const unsupportCampaign = useMutation({
    mutationFn: (id) => campaignsApi.unsupport(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-supporters', id] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to remove support'),
  });

  const addCampaignUpdate = useMutation({
    mutationFn: ({ id, formData }) => campaignsApi.postUpdate(id, formData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-updates', id] });
      toast.success('Update posted');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to post update'),
  });

  return {
    useGetCampaigns,
    useGetCampaign,
    useGetCampaignSupporters,
    useGetCampaignUpdates,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    supportCampaign,
    unsupportCampaign,
    addCampaignUpdate,
  };
};
