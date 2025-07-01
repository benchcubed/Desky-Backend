export enum Permissions {
  NONE = 0,

  // placeholders for now
  ITEM_CREATE = 1 << 0,  // 1
  ITEM_EDIT = 1 << 1,    // 2
  ITEM_DELETE = 1 << 2,  // 4

  USER_CREATE = 1 << 3,  // 8
  USER_EDIT = 1 << 4,    // 16
  USER_DELETE = 1 << 5,  // 32

}

export const Roles = {
  GUEST: Permissions.NONE,

  ITEM_CREATOR: Permissions.ITEM_CREATE,
  ITEM_EDITOR: Permissions.ITEM_CREATE | Permissions.ITEM_EDIT,
  ITEM_ADMIN: Permissions.ITEM_CREATE | Permissions.ITEM_EDIT | Permissions.ITEM_DELETE,

  USER_MANAGER: Permissions.USER_CREATE | Permissions.USER_EDIT | Permissions.USER_DELETE,

  SUPERADMIN: Object.values(Permissions).reduce((a, b) => typeof b === 'number' ? a | b : a, 0),
};

export function hasPermission(userPerms: number, requiredPerm: Permissions): boolean {
  return (userPerms & requiredPerm) === requiredPerm;
}