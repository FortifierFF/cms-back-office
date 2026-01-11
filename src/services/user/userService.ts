// User service - handles all user related API calls
import { callDelete, callGet, callPatch, callPost } from '../http'
import urls from '../http/url'

// user interface
export interface UserData {
  id: string
  email: string
  name: string
  role: string
  status: string
  permissions: string[]
  master_id?: string | null
  master_name?: string | null
  company_names?: string[]
  created_at?: string
}

// create user payload
export interface CreateUserPayload {
  email: string
  name: string
  password: string
  role: string
}

// update user payload
export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  id: string
}

// update current user profile payload
export interface UpdateProfilePayload {
  name?: string
  currentPassword?: string
  newPassword?: string
}

// create master account payload (owner only)
export interface CreateMasterPayload {
  email: string
  password: string
  name?: string
}

const userService = {
  // get list of all users (filtered by permissions)
  list: () => callGet(urls.user.list) as Promise<UserData[]>,
  // get all users in database (for owner accounts only)
  listAll: () => callGet(urls.user.listAll) as Promise<UserData[]>,

  // get single user by id
  get: (id: string) => callGet(urls.user.get(id)) as Promise<UserData>,

  // create new user
  create: (payload: CreateUserPayload) =>
    (callPost(urls.user.create, payload) as unknown) as Promise<UserData>,

  // create master account (owner only)
  createMaster: (payload: CreateMasterPayload) =>
    callPost(urls.user.createMaster, payload) as Promise<UserData & { message?: string }>,

  // update existing user
  update: (payload: UpdateUserPayload) => {
    const { id: _id, ...updateData } = payload
    return (callPatch(urls.user.update, updateData) as unknown) as Promise<UserData>
  },

  // update current user's profile (authenticated user only)
  updateProfile: (payload: UpdateProfilePayload) =>
    callPatch(urls.user.updateMe, payload) as Promise<UserData>,

  // delete user
  delete: (id: string) => callDelete(urls.user.delete(id)),

  // disable user
  disable: (id: string) => callPost(urls.user.disable(id)),

  // enable user
  enable: (id: string) => callPost(urls.user.enable(id)),
}

export default userService

