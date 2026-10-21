export type ManagedUser = {
  email: string;
  roles: string[];
  platform: { id: number; name: string } | null;
};

export type AvailableRole = {
  code: string;
  protectedRole: boolean;
};

export type UserEditorMode = "create" | "edit";

export type UserEditorValues = {
  email: string;
  password: string;
  roles: string[];
};
