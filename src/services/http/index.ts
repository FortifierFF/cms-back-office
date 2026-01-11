// HTTP service layer - wraps axios with helper functions
// Provides clean API for making HTTP requests
import { apiClient } from '@/lib/api'

// direct axios methods (returns full response)
export const get = apiClient.get
export const post = apiClient.post
export const put = apiClient.put
export const patch = apiClient.patch
export const del = apiClient.delete

// convenience methods that return only data (not full response)
export const callGet = async (url: string, config?: any) => {
  const { data } = await apiClient.get(url, config)
  return data
}

export const callPost = async (url: string, payload?: any, config?: any) => {
  const { data } = await apiClient.post(url, payload, config)
  return data
}

export const callPut = async (url: string, payload?: any, config?: any) => {
  const { data } = await apiClient.put(url, payload, config)
  return data
}

export const callPatch = async (url: string, payload?: any, config?: any) => {
  const { data } = await apiClient.patch(url, payload, config)
  return data
}

export const callDelete = async (url: string, config?: any) => {
  const { data } = await apiClient.delete(url, config)
  return data
}

// default export with all methods
const httpClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  callGet,
  callPost,
  callPut,
  callPatch,
  callDelete,
}

export default httpClient

