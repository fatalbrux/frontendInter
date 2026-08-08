// core/interfaces/auth.ts
export interface LoginResponse {
  access_token: string;
  usuario: {
    id: number;
    email: string;
    nombreCompleto: string;
    rol: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}