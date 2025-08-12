import BaseModel from '../BaseModel'

export default class NotificationModel extends BaseModel {
  constructor() {
    super('notifications')
  }
  static columns = ['id', 'type', 'title', 'content', 'created_at', 'updated_at', 'deleted_at']
  
  async createNotification(type: string, title: string, content: string) {
    try {
      const notification = {
        type,
        title,
        content,
      }
      
      return await this.create(notification)
    } catch (error) {
      console.log(error)
    }
  }
}
