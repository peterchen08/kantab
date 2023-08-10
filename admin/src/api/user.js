import axios from '@/libs/api.request'
import { getToken } from '@/libs/util'

export const login = ({ userName, passWord }) => {
  return axios.request({
    url: '/admins/auth',
    data:{
      username:userName,
      password:passWord
    },
    method: 'post'
  })
}

export const getUserInfo = () => {
  return axios.request({
    url: '/admins/me',
    method: 'get',
    headers:{
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8‘",
      "authorization": "Bearer "+getToken()
    }
  })
}

export const logout = () => {
  return axios.request({
    url: '/admins/logout',
    method: 'post'
  })
}

export const getUnreadCount = () => {
  return axios.request({
    url: 'message/count',
    method: 'get'
  })
}

export const getMessage = () => {
  return axios.request({
    url: 'message/init',
    method: 'get'
  })
}

export const getContentByMsgId = msg_id => {
  return axios.request({
    url: 'message/content',
    method: 'get',
    params: {
      msg_id
    }
  })
}

export const hasRead = msg_id => {
  return axios.request({
    url: 'message/has_read',
    method: 'post',
    data: {
      msg_id
    }
  })
}

export const removeReaded = msg_id => {
  return axios.request({
    url: 'message/remove_readed',
    method: 'post',
    data: {
      msg_id
    }
  })
}

export const restoreTrash = msg_id => {
  return axios.request({
    url: 'message/restore',
    method: 'post',
    data: {
      msg_id
    }
  })
}
