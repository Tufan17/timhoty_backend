import BaseModel from '../BaseModel'

export default class LogModel extends BaseModel {
  constructor() {
    super('logs')
  }
  static columns = ['id', 'type', 'process', 'target_name', 'target_id', 'user_id', 'content', 'created_at', 'updated_at', 'deleted_at']
  


  async createLog(user: any, process: string, target_name: string, content?: any) {
    try {
      let type = ''
      if(user.role === 'admin') {
        type = 'admin'
    } else if(user.role === 'dealer') {
      type = 'dealer'
    } else if(user.role === 'user') {
      type = 'user'
    }

    const log = {
      type: type,
      process: process,
      target_name: target_name,
      target_id:content.id || "",
      user_id: user.id,
      content: JSON.stringify(content),
    }


    return await this.create(log)
    } catch (error) {
      console.log(error)
    }
  }
}
