import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import { ACCOUNT_STATUS } from '../data/constants.js';

const DatabaseContext = createContext(null);

function mapProfileRow(row) {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    riotId: row.riot_id,
    gameRole: row.game_role,
    rankTier: row.rank_tier,
    rankDivision: row.rank_division,
    availability: row.availability ?? [],
    bio: row.bio ?? '',
    discordTag: row.discord_tag ?? '',
    updatedAt: row.updated_at,
  };
}

function mapReportRow(row) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

export function DatabaseProvider({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [accountStatusByUserId, setAccountStatusByUserId] = useState({});

  const refreshProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Erreur chargement profils', error);
      return;
    }
    setProfiles(data.map(mapProfileRow));
  }, []);

  const refreshStatuses = useCallback(async () => {
    const { data, error } = await supabase.from('account_status').select('user_id, status');
    if (error) {
      console.error('Erreur chargement statuts', error);
      return;
    }
    const map = {};
    data.forEach((row) => {
      map[row.user_id] = row.status;
    });
    setAccountStatusByUserId(map);
  }, []);

  const refreshReports = useCallback(async () => {
    if (!isAdmin) {
      setReports([]);
      return;
    }
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur chargement signalements', error);
      return;
    }
    setReports(data.map(mapReportRow));
  }, [isAdmin]);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur chargement notifications', error);
      return;
    }
    setNotifications(data.map(mapNotificationRow));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setProfiles([]);
      setAccountStatusByUserId({});
      return;
    }
    refreshProfiles();
    refreshStatuses();
  }, [currentUser, refreshProfiles, refreshStatuses]);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const getProfileByUserId = useCallback(
    (userId) => profiles.find((profile) => profile.userId === userId) ?? null,
    [profiles]
  );

  const upsertProfile = useCallback(
    async (profileData) => {
      const row = {
        user_id: profileData.userId,
        display_name: profileData.displayName,
        riot_id: profileData.riotId,
        game_role: profileData.gameRole,
        rank_tier: profileData.rankTier,
        rank_division: profileData.rankDivision,
        availability: profileData.availability,
        bio: profileData.bio,
        discord_tag: profileData.discordTag,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').upsert(row);
      if (error) throw new Error(error.message);
      await refreshProfiles();
    },
    [refreshProfiles]
  );

  const listPlayerProfiles = useCallback(() => {
    return profiles
      .filter((profile) => (accountStatusByUserId[profile.userId] ?? ACCOUNT_STATUS.ACTIVE) === ACCOUNT_STATUS.ACTIVE)
      .map((profile) => ({ profile }));
  }, [profiles, accountStatusByUserId]);

  const createReport = useCallback(
    async ({ reporterId, reportedUserId, reason, details }) => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        details,
      });
      if (error) throw new Error(error.message);
      await refreshReports();
    },
    [refreshReports]
  );

  const updateReportStatus = useCallback(
    async (reportId, status) => {
      const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
      if (error) throw new Error(error.message);
      await refreshReports();
    },
    [refreshReports]
  );

  const setUserStatus = useCallback(
    async (userId, status) => {
      const { error } = await supabase
        .from('account_status')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      await refreshStatuses();
    },
    [refreshStatuses]
  );

  const listNotificationsForUser = useCallback(() => notifications, [notifications]);

  const addNotification = useCallback(
    async ({ userId, message }) => {
      const { error } = await supabase.from('notifications').insert({ user_id: userId, message });
      if (error) throw new Error(error.message);
      await refreshNotifications();
    },
    [refreshNotifications]
  );

  const markNotificationRead = useCallback(
    async (notificationId) => {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (error) throw new Error(error.message);
      await refreshNotifications();
    },
    [refreshNotifications]
  );

  const markAllNotificationsRead = useCallback(
    async (userId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
      if (error) throw new Error(error.message);
      await refreshNotifications();
    },
    [refreshNotifications]
  );

  const value = useMemo(
    () => ({
      profiles,
      reports,
      notifications,
      accountStatusByUserId,
      getProfileByUserId,
      upsertProfile,
      listPlayerProfiles,
      createReport,
      updateReportStatus,
      setUserStatus,
      listNotificationsForUser,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      profiles,
      reports,
      notifications,
      accountStatusByUserId,
      getProfileByUserId,
      upsertProfile,
      listPlayerProfiles,
      createReport,
      updateReportStatus,
      setUserStatus,
      listNotificationsForUser,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export default DatabaseContext;
