
import BaseModel from "@/models/BaseModel";

class UserModel extends BaseModel {
  constructor() {
    super("users");
  }
  static columns = [
    'id',
    'name_surname',
    'email',
    'phone',
    'password',
    'language',
    'birthday',
    'email_verified',
    'status',
    'sms_contact',
    'email_contact',
    'push_contact',
    'electronic_contact_permission',
    'currency_id',
    'device_id',
    'verification_code',
    'verification_code_expires_at',
    'avatar',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default UserModel;
