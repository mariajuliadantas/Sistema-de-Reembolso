export type UserRole = 'COLLABORATOR' | 'MANAGER' | 'FINANCIAL' | 'ADMIN';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagedUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type UpdateManagedUserDTO = Partial<Pick<CreateManagedUserDTO, 'name' | 'email' | 'password' | 'role'>>;
