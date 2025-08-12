import BaseModel from "../BaseModel";
import knex from "@/db/knex";
import adminPermissions from "../../../permissions/admin.json";
import dealerPermissions from "../../../permissions/dealer.json";
class PermissionModel extends BaseModel {
  constructor() {
    super("permissions");
  }
  static columns = [
    "id",
    "name",
    "target",
    "target_id",
    "status",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async createOrUpdate(
    target: string,
    target_id: string,
    name: string,
    status: boolean
  ) {
    const permission = await this.first({ target, target_id, name });
    if (permission) {
      await this.update(permission.id, { status });
    } else {
      await this.create({ name, target, target_id, status });
    }
  }

  async getAdminPermissions(admin_id: string) {
    const allKeys = adminPermissions;

    const permissions = await knex("permissions")
      .where("target", "admins")
      .where("target_id", admin_id)
      .whereIn("name", allKeys)
      .select("name", "status");
    
    const permissionMap = Object.fromEntries(permissions.map(p => [p.name, p.status]));
    let completedPermissions = [];
    
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      if (permissionMap.hasOwnProperty(key)) {
        completedPermissions.push({
          name: key,
          status: permissionMap[key]
        });
      } else {
        completedPermissions.push({
          name: key,
          status: true
        });
      }
    }
    
    return completedPermissions;
  }

  async getDealerPermissions(dealer_user_id: string) {
      const allKeys = dealerPermissions;
  
      const permissions = await knex("permissions")
        .where("target", "dealer_users")
        .where("target_id", dealer_user_id)
        .whereIn("name", allKeys)
        .select("name", "status");
      
      const permissionMap = Object.fromEntries(permissions.map(p => [p.name, p.status]));
      let completedPermissions = [];
      
      for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        if (permissionMap.hasOwnProperty(key)) {
          completedPermissions.push({
            name: key,
            status: permissionMap[key]
          });
        } else {
          completedPermissions.push({
            name: key,
            status: true
          });
        }
      }
      
      return completedPermissions;
    }
}

export default PermissionModel;
