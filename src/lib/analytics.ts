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

  try {
    const { error } = await supabase
      .from('eventos_aplicacao')
      .insert({
        user_id: user.id,
        church_id: currentChurchId,
        event_name: eventName,
        event_details: details || {},
      });

    if (error) {
      console.error('Analytics: Error tracking event:', error.message);
    } else {
      console.log(`Analytics: Event '${eventName}' tracked successfully.`, details);
    }
  } catch (error) {
    console.error('Analytics: Unexpected error tracking event:', error);
  }
};