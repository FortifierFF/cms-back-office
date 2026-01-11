// Company service - handles all company related API calls
import { callDelete, callGet, callPost, callPatch } from '../http'
import urls from '../http/url'

// company interface
export interface Company {
  id: string
  master_id: string
  name: string
  slug: string
  domain?: string | null
  description?: string | null
  logo_url?: string | null
  theme?: string
  status?: string
  settings?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// create company payload
export interface CreateCompanyPayload {
  name: string
  slug?: string
  domain?: string
  description?: string
}

// update company payload
export interface UpdateCompanyPayload {
  id: string
  name?: string
  slug?: string
  domain?: string | null
  description?: string | null
  logo_url?: string | null
  theme?: string
}

// company member interface
export interface CompanyMember {
  id: string
  email: string
  name: string
  role: string
  status: string
  permissions: string[]
  assigned_at?: string
  created_at?: string
  updated_at?: string
}

// create member payload
export interface CreateMemberPayload {
  email: string
  password: string
  name?: string
  role?: 'viewer' | 'editor' | 'manager'
}

// update member payload
export interface UpdateMemberPayload {
  name?: string
  role?: 'viewer' | 'editor' | 'manager'
  permissions?: string[]
}

const companyService = {
  // get list of all companies for current master account
  list: () => callGet(urls.company.list) as Promise<Company[]>,

  // get single company by id
  get: (id: string) => callGet(urls.company.get(id)) as Promise<Company>,

  // create new company
  create: (payload: CreateCompanyPayload) =>
    callPost(urls.company.create, payload) as Promise<Company>,

  // update existing company
  update: (payload: UpdateCompanyPayload) => {
    const { id, ...updateData } = payload
    return callPatch(urls.company.update(id), updateData) as Promise<Company>
  },

  // delete company
  delete: (id: string) => callDelete(urls.company.delete(id)),

  // get members of a company
  getMembers: (companyId: string) =>
    callGet(urls.company.members(companyId)) as Promise<CompanyMember[]>,

  // create a new member for a company
  createMember: (companyId: string, payload: CreateMemberPayload) =>
    callPost(urls.company.createMember(companyId), payload) as Promise<CompanyMember>,

  // update a member of a company
  // Uses PATCH /users/:id endpoint
  updateMember: (_companyId: string, memberId: string, payload: UpdateMemberPayload) =>
    callPatch(urls.user.updateById(memberId), payload) as Promise<CompanyMember>,
}

export default companyService

