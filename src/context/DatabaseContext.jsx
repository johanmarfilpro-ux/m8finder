import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import { ACCOUNT_STATUS } from '../data/constants.js';

const DatabaseContext = createContext(null);

function mapGameRow(row) {
  return {
    id: row.id,
    label: row.label,
    roles: row.roles ?? [],
    ranks: row.ranks ?? [],
    divisions: row.divisions ?? [],
    platforms: row.platforms ?? [],
    sortOrder: row.sort_order,
  };
}

function mapProfileRow(row) {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio ?? '',
    discordTag: row.discord_tag ?? '',
    isAvailable: row.is_available ?? false,
    updatedAt: row.updated_at,
  };
}

function mapGameProfileRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    inGameId: row.in_game_id,
    roles: row.roles ?? [],
    rankTier: row.rank_tier,
    rankDivision: row.rank_division,
    platform: row.platform,
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
    messageId: row.message_id ?? null,
    reportedMessageContent: row.messages?.content ?? null,
  };
}

function mapMatchAlertRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    gameId: row.game_id,
    roles: row.roles ?? [],
    rankTiers: row.rank_tiers ?? [],
    platforms: row.platforms ?? [],
    createdAt: row.created_at,
  };
}

function mapConversationRow(row) {
  return {
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
  };
}

function mapMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    read: row.read,
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
  const [games, setGames] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [gameProfiles, setGameProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [matchAlerts, setMatchAlerts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [accountStatusByUserId, setAccountStatusByUserId] = useState({});
  const [adminUserIds, setAdminUserIds] = useState([]);

  const refreshGames = useCallback(async () => {
    const { data, error } = await supabase.from('games').select('*').order('sort_order');
    if (error) {
      console.error('Erreur chargement des jeux', error);
      return;
    }
    setGames(data.map(mapGameRow));
  }, []);

  const refreshProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Erreur chargement profils', error);
      return;
    }
    setProfiles(data.map(mapProfileRow));
  }, []);

  const refreshGameProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('game_profiles').select('*');
    if (error) {
      console.error('Erreur chargement profils de jeu', error);
      return;
    }
    setGameProfiles(data.map(mapGameProfileRow));
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

  const refreshAdminUserIds = useCallback(async () => {
    const { data, error } = await supabase.from('admins').select('user_id');
    if (error) {
      console.error('Erreur chargement des administrateurs', error);
      return;
    }
    setAdminUserIds(data.map((row) => row.user_id));
  }, []);

  const refreshMatchAlerts = useCallback(async () => {
    if (!currentUser) {
      setMatchAlerts([]);
      return;
    }
    const { data, error } = await supabase
      .from('match_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur chargement des alertes', error);
      return;
    }
    setMatchAlerts(data.map(mapMatchAlertRow));
  }, [currentUser]);

  const refreshConversations = useCallback(async () => {
    if (!currentUser) {
      setConversations([]);
      return;
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (error) {
      console.error('Erreur chargement des conversations', error);
      return;
    }
    setConversations(data.map(mapConversationRow));
  }, [currentUser]);

  const refreshUnreadMessages = useCallback(async () => {
    if (!currentUser) {
      setUnreadMessages([]);
      return;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id')
      .eq('read', false);
    if (error) {
      console.error('Erreur chargement des messages non lus', error);
      return;
    }
    setUnreadMessages(
      data
        .filter((row) => row.sender_id !== currentUser.id)
        .map((row) => ({ id: row.id, conversationId: row.conversation_id, senderId: row.sender_id }))
    );
  }, [currentUser]);

  const refreshReports = useCallback(async () => {
    if (!isAdmin) {
      setReports([]);
      return;
    }
    const { data, error } = await supabase
      .from('reports')
      .select('*, messages(content)')
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
      setGames([]);
      setProfiles([]);
      setGameProfiles([]);
      setAccountStatusByUserId({});
      setAdminUserIds([]);
      setMatchAlerts([]);
      setConversations([]);
      setUnreadMessages([]);
      return;
    }
    refreshGames();
    refreshProfiles();
    refreshGameProfiles();
    refreshStatuses();
    refreshAdminUserIds();
    refreshMatchAlerts();
    refreshConversations();
    refreshUnreadMessages();
  }, [
    currentUser,
    refreshGames,
    refreshProfiles,
    refreshGameProfiles,
    refreshStatuses,
    refreshAdminUserIds,
    refreshMatchAlerts,
    refreshConversations,
    refreshUnreadMessages,
  ]);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const getGameById = useCallback((gameId) => games.find((game) => game.id === gameId) ?? null, [games]);

  const getProfileByUserId = useCallback(
    (userId) => profiles.find((profile) => profile.userId === userId) ?? null,
    [profiles]
  );

  const getGameProfilesByUserId = useCallback(
    (userId) => gameProfiles.filter((gameProfile) => gameProfile.userId === userId),
    [gameProfiles]
  );

  const getGameProfile = useCallback(
    (userId, gameId) =>
      gameProfiles.find((gameProfile) => gameProfile.userId === userId && gameProfile.gameId === gameId) ?? null,
    [gameProfiles]
  );

  const isUserAdmin = useCallback((userId) => adminUserIds.includes(userId), [adminUserIds]);

  const upsertProfile = useCallback(
    async (profileData) => {
      const row = {
        user_id: profileData.userId,
        display_name: profileData.displayName,
        bio: profileData.bio,
        discord_tag: profileData.discordTag,
        is_available: profileData.isAvailable,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').upsert(row);
      if (error) throw new Error(error.message);
      await refreshProfiles();
    },
    [refreshProfiles]
  );

  const setAvailability = useCallback(
    async (userId, isAvailable) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      await refreshProfiles();
    },
    [refreshProfiles]
  );

  const upsertGameProfile = useCallback(
    async (gameProfileData) => {
      const row = {
        user_id: gameProfileData.userId,
        game_id: gameProfileData.gameId,
        in_game_id: gameProfileData.inGameId,
        roles: gameProfileData.roles,
        rank_tier: gameProfileData.rankTier,
        rank_division: gameProfileData.rankDivision,
        platform: gameProfileData.platform,
        updated_at: new Date().toISOString(),
      };
      // Modifier un profil existant se fait par son id (pas par upsert sur
      // la cle naturelle) : si l'utilisateur change de plateforme, upserter
      // sur (user_id, game_id, platform) risquerait de fusionner par erreur
      // avec un AUTRE profil de jeu deja existant sur cette plateforme.
      const { error } = gameProfileData.id
        ? await supabase.from('game_profiles').update(row).eq('id', gameProfileData.id)
        : await supabase.from('game_profiles').insert(row);
      if (error) {
        if (error.code === '23505') {
          throw new Error('Tu as deja un profil pour ce jeu sur cette plateforme.');
        }
        throw new Error(error.message);
      }
      await refreshGameProfiles();
    },
    [refreshGameProfiles]
  );

  const deleteGameProfile = useCallback(
    async (gameProfileId) => {
      const { error } = await supabase.from('game_profiles').delete().eq('id', gameProfileId);
      if (error) throw new Error(error.message);
      await refreshGameProfiles();
    },
    [refreshGameProfiles]
  );

  const listGameProfilesForGame = useCallback(
    (gameId) => {
      return gameProfiles
        .filter((gameProfile) => gameProfile.gameId === gameId)
        .filter(
          (gameProfile) =>
            (accountStatusByUserId[gameProfile.userId] ?? ACCOUNT_STATUS.ACTIVE) === ACCOUNT_STATUS.ACTIVE
        )
        .map((gameProfile) => ({
          gameProfile,
          profile: getProfileByUserId(gameProfile.userId),
        }))
        .filter(({ profile }) => Boolean(profile));
    },
    [gameProfiles, accountStatusByUserId, getProfileByUserId]
  );

  const createReport = useCallback(
    async ({ reporterId, reportedUserId, reason, details, messageId = null }) => {
      if (isUserAdmin(reportedUserId)) {
        throw new Error('Les comptes administrateurs ne peuvent pas etre signales.');
      }
      const { error } = await supabase.from('reports').insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        details,
        message_id: messageId,
      });
      if (error) throw new Error(error.message);
      await refreshReports();
    },
    [refreshReports, isUserAdmin]
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

  const createMatchAlert = useCallback(
    async ({ userId, gameId, roles, rankTiers, platforms }) => {
      const { error } = await supabase.from('match_alerts').insert({
        user_id: userId,
        game_id: gameId,
        roles,
        rank_tiers: rankTiers,
        platforms,
      });
      if (error) throw new Error(error.message);
      await refreshMatchAlerts();
    },
    [refreshMatchAlerts]
  );

  const deleteMatchAlert = useCallback(
    async (matchAlertId) => {
      const { error } = await supabase.from('match_alerts').delete().eq('id', matchAlertId);
      if (error) throw new Error(error.message);
      await refreshMatchAlerts();
    },
    [refreshMatchAlerts]
  );

  const getConversationWith = useCallback(
    (otherUserId) =>
      conversations.find(
        (conversation) =>
          (conversation.userAId === currentUser?.id && conversation.userBId === otherUserId) ||
          (conversation.userBId === currentUser?.id && conversation.userAId === otherUserId)
      ) ?? null,
    [conversations, currentUser]
  );

  const getOrCreateConversation = useCallback(
    async (otherUserId) => {
      const existing = getConversationWith(otherUserId);
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_a_id: currentUser.id, user_b_id: otherUserId })
        .select()
        .single();

      if (error) {
        // Course possible si les deux joueurs demarrent la conversation en
        // meme temps : l'index unique bloque le doublon, on relit alors la
        // conversation deja creee par l'autre insert.
        if (error.code === '23505') {
          await refreshConversations();
          const retry = getConversationWith(otherUserId);
          if (retry) return retry.id;
        }
        throw new Error(error.message);
      }

      await refreshConversations();
      return data.id;
    },
    [currentUser, getConversationWith, refreshConversations]
  );

  const fetchMessages = useCallback(async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data.map(mapMessageRow);
  }, []);

  const sendMessage = useCallback(
    async ({ conversationId, content }) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content,
      });
      if (error) throw new Error(error.message);
      await refreshConversations();
    },
    [currentUser, refreshConversations]
  );

  const markConversationRead = useCallback(
    async (conversationId) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id)
        .eq('read', false);
      if (error) throw new Error(error.message);
      await refreshUnreadMessages();
    },
    [currentUser, refreshUnreadMessages]
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
      games,
      profiles,
      gameProfiles,
      reports,
      notifications,
      matchAlerts,
      conversations,
      unreadMessages,
      accountStatusByUserId,
      adminUserIds,
      isUserAdmin,
      getGameById,
      getProfileByUserId,
      getGameProfilesByUserId,
      getGameProfile,
      upsertProfile,
      setAvailability,
      upsertGameProfile,
      deleteGameProfile,
      listGameProfilesForGame,
      createReport,
      updateReportStatus,
      setUserStatus,
      listNotificationsForUser,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      createMatchAlert,
      deleteMatchAlert,
      getConversationWith,
      getOrCreateConversation,
      fetchMessages,
      sendMessage,
      markConversationRead,
    }),
    [
      games,
      profiles,
      gameProfiles,
      reports,
      notifications,
      matchAlerts,
      conversations,
      unreadMessages,
      accountStatusByUserId,
      adminUserIds,
      isUserAdmin,
      getGameById,
      getProfileByUserId,
      getGameProfilesByUserId,
      getGameProfile,
      upsertProfile,
      setAvailability,
      upsertGameProfile,
      deleteGameProfile,
      listGameProfilesForGame,
      createReport,
      updateReportStatus,
      setUserStatus,
      listNotificationsForUser,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      createMatchAlert,
      deleteMatchAlert,
      getConversationWith,
      getOrCreateConversation,
      fetchMessages,
      sendMessage,
      markConversationRead,
    ]
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export default DatabaseContext;
