import { z } from "zod";

export const settingsSchema = z.object({
  inheritGlobal: z.boolean(),
  saturdayDayOff: z.boolean(),
  sundayDayOff: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
