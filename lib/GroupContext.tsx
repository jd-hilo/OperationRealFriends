import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

interface GroupContextType {
  group: any;
  loading: boolean;
  refresh: () => void;
}
const GroupContext = createContext<GroupContextType>({ group: null, loading: true, refresh: () => {} });

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGroup = async () => {
    if (!user) {
      setGroup(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch user to get current_group_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (userError || !userData || !userData.current_group_id) {
        setGroup(null);
        setLoading(false);
        return;
      }
      // Fetch group and members
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', userData.current_group_id)
        .single();
      if (groupError || !groupData) {
        setGroup(null);
        setLoading(false);
        return;
      }
      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('current_group_id', groupData.id);
      if (membersError) {
        setGroup(null);
        setLoading(false);
        return;
      }
      // Fetch submissions for the current prompt
      let updatedMembers = members;
      if (groupData.current_prompt_id) {
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('group_id', groupData.id)
          .eq('prompt_id', groupData.current_prompt_id);
        if (!submissionsError && submissions) {
          updatedMembers = members.map(member => ({
            ...member,
            submitted: submissions.some(sub => sub.user_id === member.id)
          }));
        }
      }
      setGroup({ ...groupData, members: updatedMembers });
    } catch (e) {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    // Optionally, add polling or subscription here
  }, [user]);

  return (
    <GroupContext.Provider value={{ group, loading, refresh: fetchGroup }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext); 