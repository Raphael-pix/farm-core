-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND farm_id = (SELECT farm_id FROM public.users WHERE id = auth.uid())
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND farm_id = (SELECT farm_id FROM public.users WHERE id = auth.uid())
  );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND farm_id = (SELECT farm_id FROM public.users WHERE id = auth.uid())
  );

-- Trigger (backend service role) creates notifications (no client INSERT policy)
CREATE POLICY "No direct notification inserts from client"
  ON public.notifications
  FOR INSERT
  WITH CHECK (FALSE);