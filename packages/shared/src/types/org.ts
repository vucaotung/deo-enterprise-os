export interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface OrgMember {
  userId: string;
  companyId: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: string;
}
