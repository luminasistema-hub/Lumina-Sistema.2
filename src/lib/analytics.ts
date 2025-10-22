import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';

interface EventDetails {
  [key: string]: any;
}

export const trackEvent = async (eventName: string, details?: EventDetails) => {
  const { user, currentChurchId } = useAuthStore.getState();

  if (!user) {
    console.warn('Analytics: Cannot track event, user not authenticated.');
    return;
  }

  const { error } = await supabase
    .from('eventos_aplicacao')
    .insert({
      membro_id: user.id,
      church_id: currentChurchId,
      event_name: eventName,
      event_details: details || {},
    });

  if (error) {
    console.error('Analytics: Error tracking event:', error.message);
  } else {
    console.log(`Analytics: Event '${eventName}' tracked successfully.`, details);
  }
};